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

export type FunctionType = 'raw' | 'lang' | 'simplify' | 'is_bound';

export const FUNCTION_OPTIONS: OptionType<FunctionType>[] = [
  { label: 'Raw expr', value: 'raw' },
  { label: 'Language', value: 'lang' },
  { label: 'Simplify', value: 'simplify' },
  { label: 'IsBound', value: 'is_bound' },
];

export type DTypeFilterType = 'string' | 'number' | 'boolean' | 'integer' | 'float' | 'datetime' | 'duration' | 'iri' | 'url' | 'literal' | 'null' | 'non_null' | 'property';

export const DTYPE_FILTER_OPTIONS: OptionType<DTypeFilterType>[] = [
  { label: 'String', value: 'string' },
  { label: 'Number', value: 'number' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Integer', value: 'integer' },
  { label: 'Float', value: 'float' },
  { label: 'Datetime', value: 'datetime' },
  { label: 'Duration', value: 'duration' },
  { label: 'IRI', value: 'iri' },
  { label: 'URL', value: 'url' },
  { label: 'Any Literal', value: 'literal' },
  { label: 'NULL', value: 'null' },
  { label: 'Non NULL', value: 'non_null' },
  { label: 'Property (direct)', value: 'property' },
];
