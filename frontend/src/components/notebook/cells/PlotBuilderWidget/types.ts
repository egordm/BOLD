import { RuleGroupType } from "react-querybuilder";
import { OptionType } from "../../../input/VariableInput";
import { VariableSelectorValue } from "./VariableSelector";

export interface PlotBuilderData {
  tree: RuleGroupType,
  x: VariableSelectorValue,
  y: VariableSelectorValue,
  z: VariableSelectorValue,

  max_groups_x?: number;
  min_group_x_size?: number;
  max_groups_z?: number;
  min_group_z_size?: number;
  xy_only: boolean;

  output_mode?: string;

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

