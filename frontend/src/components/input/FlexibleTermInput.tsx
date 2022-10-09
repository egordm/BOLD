import { FormControl, MenuItem, Select, Stack, TextField } from "@mui/material";
import { AutocompleteProps } from "@mui/material/Autocomplete/Autocomplete";
import { makeStyles } from "@mui/styles";
import { Box } from "@mui/system";
import React, { useMemo } from "react";
import { Term, TermPos } from "../../types/terms";
import { GutterInput, GutterSelect } from "./GutterInput";
import { QueryContext } from "./QueryBuilder/config";
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
  context?: Partial<QueryContext>
} & Partial<Omit<AutocompleteProps<any, false, false, true>, 'onChange'>>) => {
  const {
    type = 'search',
    variable,
    search,
    manual,
  } = value ?? {};

  const { datasetId, variables, prefixes, wikidata } = context ?? {};

  const labels = { ...LABELS, ...partialLabels, label };
  const classes = useStyles();

  const type_options = useMemo(() => wikidata && pos === 'OBJECT'
      ? [ ...TYPE_OPTIONS, { value: 'statement', label: 'Statement Variable' } ]
      : TYPE_OPTIONS,
    [ wikidata, pos ]
  );

  let input = null;
  switch (type) {
    case 'statement':
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
    <GutterInput
      padGutter={false}
      gutter={(<>
        {beforeGutter}
        <GutterSelect
          value={type}
          onChange={(type) => onChange({ ...value, type })}
          options={type_options}
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
  variable?: {
    value: string,
  };
}

const TYPE_OPTIONS = [
  { value: 'search', label: 'Search' },
  { value: 'manual', label: 'Manual' },
  { value: 'variable', label: 'Variable' },
  { value: 'any', label: 'Any' },
]
