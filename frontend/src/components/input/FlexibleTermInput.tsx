import { FormControl, MenuItem, Select, Stack, TextField } from "@mui/material";
import { AutocompleteProps } from "@mui/material/Autocomplete/Autocomplete";
import { makeStyles } from "@mui/styles";
import { Box } from "@mui/system";
import React from "react";
import { Term, TermPos } from "../../types/terms";
import { TermInput } from "./TermInput";
import { VariableInput } from "./VariableInput";
import './styles.css';

const useStyles = makeStyles((theme) => ({
  manualField: {
    "& textarea": {
      fontFamily: "monospace"
    }
  }
}));

const LABELS = {
  label: 'Variable to filter',
  variableLabel: undefined as string | undefined,
  searchLabel: undefined as string | undefined,
  manualLabel: undefined as string | undefined,
  anyLabel: undefined as string | undefined,
}

export const FlexibleTermInput = ({
  value,
  onChange,
  context,
  pos,
  sx,
  beforeGutter,
  afterGutter,
  labels: partialLabels,
  label,
  ...props
}: {
  value?: FlexibleTerm,
  onChange?: (value: FlexibleTerm) => void,
  beforeGutter?: React.ReactNode,
  afterGutter?: React.ReactNode,
  pos: TermPos,
  labels?: Partial<typeof LABELS>,
  label?: string,
  context?: Partial<{
    variables: string[],
    prefixes: any,
    datasetId: any,
  }>
} & Partial<Omit<AutocompleteProps<any, false, false, true>, 'onChange'>>) => {
  const {
    type = 'search',
    variable,
    search,
    manual,
  } = value ?? {};

  const { datasetId, variables, prefixes } = context ?? {};

  const labels = { ...LABELS, ...partialLabels, label };
  const classes = useStyles();

  let input = null;
  switch (type) {
    case 'variable':
      input = (<VariableInput
        label={labels.variableLabel ?? labels.label}
        sx={{ flex: 1 }}
        options={variables as any}
        value={variable}
        onChange={(variable) => onChange({ ...value, type, variable })}
        allowAny={false}
      />)
      break;
    case 'search':
      input = (<TermInput
        sx={{ flex: 1 }}
        label={labels.searchLabel ?? labels.label}
        datasetId={datasetId}
        pos={pos}
        value={search ?? []}
        onChange={(search) => onChange({ ...value, type, search })}
        prefixes={prefixes}
      />)
      break;
    case 'manual':
      input = (
        <TextField
          sx={{ flex: 1 }}
          className={classes.manualField}
          label={labels.manualLabel ?? labels.label}
          variant="filled"
          placeholder="Enter a valid SPARQL term"
          value={manual ?? ''}
          onChange={(e) => onChange({ ...value, type, manual: e.target.value })}
        />
      );
      break;
    case 'any':
      input = (
        <TextField
          sx={{ flex: 1 }}
          className={classes.manualField}
          label={labels.anyLabel ?? labels.label}
          variant="filled"
          value={'Any'}
          disabled={true}
        />
      );
      break;

  }

  return (
    <Stack
      className='flexible-term-input'
      sx={sx}
      direction="column"
      justifyContent="stretch">
      <Box sx={{display: 'flex'}}>
        {input}
      </Box>
      <Stack
        className="gutter"
        direction="row"
        justifyContent="stretch"
        sx={{
          backgroundColor: 'rgba(0, 0, 0, 0.08)',
          borderBottomLeftRadius: 4,
          borderBottomRightRadius: 4,
        }}
      >
        {beforeGutter}
        <FormControl sx={{ m: 0, flex: 1, pr: 1 }} size="small" variant="standard">
          <Select
            value={type}
            onChange={(event) => onChange({ ...value, type: event.target.value })}
            sx={{ fontSize: 10, boxShadow: 0 }}
            disableUnderline={true}
          >
            <MenuItem value='search'>SEARCH</MenuItem>
            <MenuItem value='manual'>MANUAL</MenuItem>
            <MenuItem value='variable'>VARIABLE</MenuItem>
            <MenuItem value='any'>ANY</MenuItem>
          </Select>
        </FormControl>
        {afterGutter}
      </Stack>
    </Stack>
  );
};


export interface FlexibleTerm {
  type: 'search' | 'manual' | 'variable' | 'any';
  search?: Term[];
  manual?: string;
  variable?: {
    value: string,
  };
}
