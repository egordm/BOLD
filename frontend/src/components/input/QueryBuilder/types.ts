import { OptionType } from "../VariableInput";

export type OpType = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'null' | 'not_null' | 'raw';

export type DType = 'string' | 'boolean' | 'integer' | 'decimal' | 'datetime' | 'url' | 'term';

export type Quantifier = 'must' | 'must_not' | 'optional';

export type OperatorType = 'filter' | 'datatype' | 'operator' | 'subclass_of' | 'function';

export const QUANTIFIER_OPTIONS: OptionType<Quantifier>[] = [
  { label: 'Must', value: 'must' },
  { label: 'Must Not', value: 'must_not' },
  { label: 'Optional', value: 'optional' },
];

export type FunctionType = 'raw';

export const FUNCTION_OPTIONS: OptionType<FunctionType>[] = [
  { label: 'Raw', value: 'raw' },
];
