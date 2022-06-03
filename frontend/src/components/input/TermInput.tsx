import LocationOnIcon from "@mui/icons-material/LocationOn";
import { Autocomplete, Button, CircularProgress, IconButton, TextField } from "@mui/material";
import { AutocompleteProps } from "@mui/material/Autocomplete/Autocomplete";
import Box from "@mui/material/Box";
import { ChipTypeMap } from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import axios from "axios";
import throttle from "lodash/throttle";
import React from "react";

export interface Term {
  iri: string;
  label?: string;
  ty?: string;
  pos?: number;
}

interface SearchResult<T> {
  count: number;
  hits: readonly {
    score: number;
    document: T;
  }[];
}

interface Props extends AutocompleteProps<Term[], true, undefined, undefined> {
}

export const TermInput = (props: Props) => {
  const [ value, setValue ] = React.useState<Term[]>([]);
  const [ inputValue, setInputValue ] = React.useState('');
  const [ options, setOptions ] = React.useState<readonly Term[]>([]);

  const fetch = React.useMemo(() => throttle(
    async (
      request: { query: string },
      callback: (result?: SearchResult<Term>) => void,
    ) => {
      const result = await axios.get(
        'http://127.0.0.1:8000/api/data/yago/search_terms',
        {
          params: {
            limit: 10,
            query: request.query,
          }
        }
      )
      callback(result.data)
    },
    200), [])

  React.useEffect(() => {
    let active = true;

    if (inputValue === '') {
      setOptions(value ? value : []);
      return undefined;
    }

    fetch({ query: inputValue }, (results?: SearchResult<Term>) => {
      if (active) {
        let newOptions: readonly Term[] = [];

        if (value) {
          newOptions = [...value];
        }

        if (results) {
          newOptions = [...newOptions, ...results.hits.map(hit => hit.document)];
        }

        setOptions(newOptions);
        console.log('Setting options', newOptions)
      }
    });

    return () => {
      active = false;
    };
  }, [value, inputValue, fetch]);

  const posToStr = {
    0: 'S',
    1: 'P',
    2: 'v',
  }


  return (
    <Autocomplete
      autoComplete
      multiple
      id="combo-box-demo"
      getOptionLabel={(option) => option.iri}
      filterOptions={(x) => x}
      options={options}
      onChange={(event, newValue: Term[]) => {
        setOptions(newValue ? [...newValue, ...options] : options);
        setValue(newValue);
      }}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          fullWidth
          label="Group Prop"
        />
      )}
      renderOption={(props, option) => {
        console.log(option)

        return (
          <li {...props}>
            <Grid container alignItems="center">
              <Grid item>
                <Button size="small" variant="contained" sx={{
                  mr: 2, minWidth: 34, borderRadius: '50%',
                  padding: "6px 0px", textTransform: 'uppercase'
                }} color={{ 0: 'secondary', 1: 'warning',  2: 'error'}[option.pos]}>
                  {{ 0: 'S', 1: 'P',  2: 'V'}[option.pos]}
                </Button>
              </Grid>
              <Grid item xs>
                <span style={{fontWeight: 400}}>
                  {option.iri} ({option.count})
                </span>
                <Typography variant="body2" color="text.secondary">
                  {option.label}
                </Typography>
              </Grid>
            </Grid>
          </li>
        );
      }}
      {...props}
    />
  )
}
