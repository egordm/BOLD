import {
  Autocomplete,
  Avatar,
  Badge,
  Box, Chip,
  Divider,
  ListItem,
  ListItemAvatar,
  ListItemText, Table, TableBody, TableCell, TableRow,
  TextField, Tooltip, Typography
} from "@mui/material";
import { AutocompleteProps } from "@mui/material/Autocomplete/Autocomplete";
import _ from "lodash";
import throttle from "lodash/throttle";
import React, { useMemo } from "react";
import { Term, TermPos, SearchResult } from "../../types/terms";
import { apiClient } from "../../utils/api";
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import { extractIriLabel, formatIri } from "../../utils/formatting";

const POS_TO_ID = {
  'SUBJECT': 0,
  'PREDICATE': 1,
  'OBJECT': 2,
}


export const TermInput = (props: {
  datasetId: string;
  pos: TermPos,
  prefixes?: Record<string, string>
  onChange?: (terms: Term[]) => void;
} & Omit<AutocompleteProps<Term, true, false, undefined>, 'onChange'>) => {
  const { datasetId, pos, prefixes, onChange } = props;

  const [ value, setValue ] = React.useState<Term[]>([]);
  const [ inputValue, setInputValue ] = React.useState('');
  const [ options, setOptions ] = React.useState<readonly Term[]>([]);

  const fetchOptions = React.useMemo(() => throttle(
    async (
      request: { query: string },
      callback: (result?: SearchResult<Term>) => void,
    ) => {
      const result = await apiClient.get(`/terms/${datasetId}/search`, {
        params: {
          limit: 10,
          query: `+pos:${POS_TO_ID[pos]} ${request.query}`,
        }
      })
      callback(result.data)
    }, 200), [ pos, datasetId ]);

  React.useEffect(() => {
    let active = true;

    if (inputValue === '') {
      setOptions(value ? value : []);
      return undefined;
    }

    fetchOptions({ query: inputValue }, (results?: SearchResult<Term>) => {
      if (active) {
        const optionCandidates: readonly Term[] = results
          ? [ ...value, ...results.hits.map(hit => hit.document) ]
          : [ ...value ];

        const options = _.uniqBy(optionCandidates, 'value');
        setOptions(options);
      }
    });

    return () => {
      active = false;
    };
  }, [ value, inputValue, fetch ]);

  const renderInput = useMemo(() => (params) => (
    <TextField
      {...params}
      fullWidth
      label="Group Prop"
    />
  ), []);

  const renderOption = useMemo(() => (props, option: Term) => {
    const { className, ...rest } = props;

    const bgcolor = option.pos === 'SUBJECT' ? 'info.light'
      : option.pos === 'PREDICATE' ? 'warning.light'
        : 'success.light';

    const iri = option.type === 'uri' ? formatIri(option.value, prefixes || {}) : option.value;
    const primary = option.label ? option.label : extractIriLabel(option.value);
    const secondary = option.type === 'uri' ? iri : option.pos;

    return (
      <>
        <ListItem {...rest} sx={{ alignItems: 'stretch', cursor: 'pointer' }}>
          <Box sx={{ width: 4, bgcolor, mr: 1, borderRadius: 1 }}/>
          <ListItemText
            primary={<>
              <Typography component="span" fontWeight={option.label ? 500 : 'normal'}>{primary} </Typography>
              <Typography variant="caption" component="span">({option.count})</Typography>
            </>}
            secondary={secondary}
          />
        </ListItem>
        <Divider variant="fullWidth" component="li"/>
      </>
    )
  }, [ prefixes ]);

  const renderTag = useMemo(() => (props, option: Term) => {
    const iri = option.type === 'uri' ? formatIri(option.value, prefixes || {}) : option.value;
    const primary = option.label ? option.label : extractIriLabel(option.value);

    return (
      <Tooltip sx={{ maxWidth: 'none' }} arrow title={iri}>
        <Chip
          label={<>
            <Typography variant="body2" component="span" fontWeight={option.label ? 500 : 'normal'}>{primary} </Typography>
            <Typography variant="caption" component="span">({option.count})</Typography>
          </>}
          {...props}
        />
      </Tooltip>
    )
  }, [ prefixes ]);

  return (
    <Autocomplete
      autoComplete
      multiple
      options={options}
      getOptionLabel={(option) => typeof option === 'string' ? option : option.value}
      filterOptions={(x) => x}
      // @ts-ignore
      onChange={(event, newValue: Term[]) => {
        setOptions(newValue ? [ ...newValue, ...options ] : options);
        setValue(newValue);
        if (onChange) onChange(newValue);
      }}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      renderInput={renderInput}
      renderOption={renderOption}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => renderTag(getTagProps({ index }), option as Term))
      }
      {...props}
    />
  )

}
