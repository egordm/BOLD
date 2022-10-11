import { FormControl, MenuItem, Select, Stack, TextField, TextFieldProps } from "@mui/material";
import { AutocompleteProps } from "@mui/material/Autocomplete/Autocomplete";
import { makeStyles } from "@mui/styles";
import { Box } from "@mui/system";
import React, { useMemo } from "react";
import { Term, TermPos } from "../../types/terms";
import { GutterInput, GutterSelect } from "./GutterInput";
import { QueryContext } from "./QueryBuilder/config";
import { TermInput } from "./TermInput";
import { OptionType, VariableInput } from "./VariableInput";
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
  beforeGutter,
  afterGutter,
  labels: partialLabels,
  label,
  allowVars, allowAny,
  sx,
  ...props
}: {
  value?: FlexibleTerm,
  onChange?: (value: FlexibleTerm) => void,
  beforeGutter?: React.ReactNode,
  afterGutter?: React.ReactNode,
  pos: TermPos,
  labels?: Partial<typeof LABELS>,
  label?: string,
  context?: Partial<QueryContext>,
  allowVars?: boolean,
  allowAny?: boolean,
  sx?: any,
} & Partial<Omit<TextFieldProps, 'onChange'>>) => {
  const {
    type = 'search',
    variable,
    search,
    manual,
  } = value ?? {};

  const { datasetId, variables, prefixes, wikidata } = context ?? {};

  const labels = { ...LABELS, ...partialLabels, label };
  const classes = useStyles();

  const type_options = useMemo(() => {
    const result = [
      { value: 'search', label: 'Search' },
      { value: 'manual', label: 'Manual' },
    ]
    if (allowVars ?? true) {
      result.push({ value: 'variable', label: 'Variable' });
    }
    if (wikidata && pos === 'OBJECT') {
      result.push({ value: 'statement', label: 'Statement Variable' })
    }
    if (allowAny ?? true) {
      result.push({ value: 'any', label: 'Any' })
    }
    return result;
  }, [ wikidata, pos, allowVars, allowAny ]);

  let input = null;
  switch (type) {
    case 'statement':
    case 'variable':
      input = (<VariableInput
        label={labels.variableLabel ?? labels.label}
        sx={{ flex: 1 }}
        options={variables as any}
        value={variable}
        onChange={(variable: OptionType) => onChange({ ...value, type, variable })}
        allowAny={false}
        {...props as any}
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
        {...props as any}
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
          {...props}
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
          {...props}
        />
      );
      break;
  }

  return (
    <GutterInput
      padGutter={false}
      sx={sx}
      gutter={(<>
        {beforeGutter}
        <GutterSelect
          value={type}
          onChange={(type: FlexibleTermType) => onChange({ ...value, type })}
          options={type_options}
          disabled={props.disabled ?? false}
        />
        {afterGutter}
      </>)}
    >
      {input}
    </GutterInput>
  )
};


export type FlexibleTermType = 'search' | 'manual' | 'variable' | 'any' | 'statement';

export interface FlexibleTerm {
  type: FlexibleTermType;
  search?: Term[];
  manual?: string;
  variable?: Partial<OptionType>;
}
