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
  label?: string;
  prefixes?: Record<string, string>
  value?: Term[];
  onChange?: (terms: Term[]) => void;
  limit?: number;
} & Partial<Omit<AutocompleteProps<Term, true, false, undefined>, 'onChange'>>) => {
  const { datasetId, pos, prefixes, label, onChange, limit, value: propValue, ...rest } = props;

  const [ valueInternal, setValue ] = React.useState<Term[]>([]);
  const [ inputValue, setInputValue ] = React.useState('');
  const [ options, setOptions ] = React.useState<readonly Term[]>([]);

  const value = propValue ?? valueInternal;

  const fetchOptions = React.useMemo(() => throttle(
    async (
      request: { query: string },
      callback: (result?: SearchResult<Term>) => void,
    ) => {
      const result = await apiClient.get(`/terms/${datasetId}/search`, {
        params: {
          limit: limit ?? 50,
          query: `+pos:${POS_TO_ID[pos]} ${request.query}`,
        }
      })
      callback(result.data)
    }, 200), [ pos, datasetId, limit ]);

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
      variant="filled"
      fullWidth
      label={label}
    />
  ), [label]);

  const renderOption = useMemo(() => (props, option: Term) => {
    const { className, ...rest } = props;

    const bgcolor = option.pos === 'SUBJECT' ? 'info.light'
      : option.pos === 'PREDICATE' ? 'warning.light'
        : 'success.light';

    const iri = option.type === 'uri' ? formatIri(option.value, prefixes || {}) : option.value;
    const primary = option.label ? option.label : extractIriLabel(option.value);
    const secondary = iri;

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

  const renderTag = useMemo(() => (index, props, option: Term) => {
    const iri = option.type === 'uri' ? formatIri(option.value, prefixes || {}) : option.value;
    const primary = option.label ? option.label : extractIriLabel(option.value);

    return (
      <Tooltip key={index} sx={{ maxWidth: 'none' }} arrow title={iri}>
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
      value={value}
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
        tagValue.map((option, index) => renderTag(index, getTagProps({ index }), option as Term))
      }
      {...rest}
    />
  )

}
