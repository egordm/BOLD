import styled from "@emotion/styled";
import {
  Autocomplete,
  Box, Chip,
  Divider, Link,
  ListItem,
  ListItemText, Stack, TextField, Tooltip, Typography
} from "@mui/material";
import { AutocompleteProps } from "@mui/material/Autocomplete/Autocomplete";
import _ from "lodash";
import throttle from "lodash/throttle";
import React, { useMemo } from "react";
import { useApi } from "../../hooks/useApi";
import { Term, TermPos, SearchResult } from "../../types/terms";
import { extractIriLabel, formatIri } from "../../utils/formatting";

export const TermInput = (props: {
  datasetId: string;
  pos: TermPos,
  label?: React.ReactNode;
  prefixes: Record<string, string> | null
  value?: Term[];
  onChange?: (terms: Term[]) => void;
  limit?: number;
} & Partial<Omit<AutocompleteProps<Term, true, false, undefined>, 'onChange'>>) => {
  const { datasetId, pos, label, onChange, prefixes, limit, value: propValue, ...rest } = props;

  const [ valueInternal, setValue ] = React.useState<Term[]>([]);
  const [ inputValue, setInputValue ] = React.useState('');
  const [ options, setOptions ] = React.useState<readonly Term[]>([]);

  const value = propValue ?? valueInternal;
  const apiClient = useApi();

  const fetchOptions = React.useMemo(() => throttle(
    async (
      request: { query: string },
      callback: (result?: SearchResult<Term>) => void,
    ) => {
      const result = await apiClient.get(`/datasets/${datasetId}/search`, {
        params: {
          limit: limit ?? 50,
          query: request.query,
          pos,
        }
      })
      callback(result.data)
    }, 200), [ pos, datasetId, limit ]);

  React.useEffect(() => {
    let active = true;

    // if (inputValue === '') {
    //   setOptions(value ? value : []);
    //   return undefined;
    // }

    fetchOptions({ query: inputValue }, (results?: SearchResult<Term>) => {
      if (active) {
        const optionCandidates: readonly Term[] = results
          ? [ ...(value ?? []), ...results.hits.map(hit => hit.document) ]
          : [ ...(value ?? []) ];

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
  ), [ label ]);

  const renderOption = useMemo(() => (props, option: Term) => {
    const { key, className, ...rest } = props;

    const bgcolor = option.pos === 'SUBJECT' ? 'info.light'
      : option.pos === 'PREDICATE' ? 'warning.light'
        : 'success.light';

    const iri = option.type === 'uri' ? formatIri(option.value, prefixes || {}) : option.value;
    const primary = option.label ? option.label : extractIriLabel(option.value);
    const secondary = option.description
      ? (<span>{iri}<br/>{_.capitalize(_.truncate(option.description, { length: 100 }))}</span>)
      : iri;

    return (
      <div key={key}>
        <ListItem {...rest} sx={{ alignItems: 'stretch', cursor: 'pointer' }}>
          <Box sx={{ width: 4, bgcolor, mr: 1, borderRadius: 1 }}/>
          <ListItemText
            primary={<>
              <Typography component="span" fontWeight={option.label ? 500 : 'normal'}>{primary} </Typography>
              {option?.count === 0
                ? <Typography variant="caption" component="span">(default)</Typography>
                : option?.count
                  ? <Typography variant="caption" component="span">({option.count})</Typography>
                  : null
              }
            </>}
            secondary={secondary}
          />
        </ListItem>
        <Divider variant="fullWidth" component="li"/>
      </div>
    )
  }, [ prefixes ]);

  const renderTag = useMemo(() => (index, props, option: Term) => {
    return (
      <TermChip
        key={index}
        term={option}
        chipProps={props}
        prefixes={prefixes}
      />
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

const PropsTable = styled.table`
  td, td * {
    vertical-align: top;
    word-wrap: anywhere;
  }

  td:first-of-type {
    padding-right: 8px;
  }

`

const TermChip = ({ term, prefixes, chipProps, ...rest }: {
  term: Term;
  prefixes?: Record<string, string>;
  chipProps?: any;
}) => {
  const iri = term.type === 'uri' ? formatIri(term.value, prefixes || {}) : term.value;
  const primary = term.label ? term.label : extractIriLabel(term.value);

  return (
    <Tooltip componentsProps={{
      tooltip: {
        sx: {
          minWidth: 300,
        }
      },
      popper: {
        sx: {
          minWidth: 300,
        }
      },
    }} arrow title={
      <Stack>
        <PropsTable>
          <tbody>
            <tr>
              <td>IRI</td>
              <td><Link href={term.value} style={{
                color: 'white'
              }} target="_blank">{iri}</Link></td>
            </tr>
            {term.description && <tr>
                <td>Description</td>
                <td>{term.description}</td>
            </tr>}
            {term.range && <tr>
                <td>Range</td>
                <td>{term.range}</td>
            </tr>}
            {term.lang && <tr>
                <td>Lang</td>
                <td>{term.lang}</td>
            </tr>}
            {term.rdf_type && <tr>
                <td>RDF Type</td>
                <td>{term.rdf_type}</td>
            </tr>}
          </tbody>
        </PropsTable>
      </Stack>
    } {...rest}>
      <Chip
        label={<>
          <Typography variant="body2" component="span"
                      fontWeight={term.label ? 500 : 'normal'}>{primary} </Typography>
          {term.count &&
              <Typography variant="caption" component="span">({term.count})</Typography>}
        </>}
        {...chipProps}
      />
    </Tooltip>
  )
}
