import { RuleGroupType } from "react-querybuilder";
import { VariableSelectorValue } from "./VariableSelector";

export interface PlotBuilderData {
  tree: RuleGroupType,
  x: VariableSelectorValue,
  y: VariableSelectorValue,
  z: VariableSelectorValue,

  max_groups_x?: number;
  max_groups_z?: number;
  min_group_size?: number;
  xy_only: boolean;

  wikidata?: boolean;
  output_mode?: string;
  output_config?: OutputConfig;
}

export interface OutputConfig {
  plot_type?: string;
  group_mode?: string;
  normalize?: boolean;
}

export const VARIABLE_DTYPE = [
  { value: 'categorical', label: 'Categorical' },
  { value: 'numeric', label: 'Numeric' },
  { value: 'date', label: 'Date' },
]

export const AGGREGATE_FUNCTIONS = [
  { value: 'COUNT', label: 'COUNT' },
  { value: 'SUM', label: 'SUM' },
  { value: 'AVG', label: 'AVG' },
  { value: 'MIN', label: 'MIN' },
  { value: 'MAX', label: 'MAX' },
]

export const RESULT_SUFFIX = '__out';
