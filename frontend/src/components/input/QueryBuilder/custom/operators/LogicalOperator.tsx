import { DateTimePicker } from "@mui/lab";
import { Autocomplete, Stack, StackProps, TextField } from "@mui/material";
import { literal } from "@rdfjs/data-model";
import React from "react";
import { Checkbox } from "../../../Checkbox";
import { FlexibleTermInput } from "../../../FlexibleTermInput";
import { OptionType } from "../../../VariableInput";


export default ({
  value,
  setValue,
  context,
  parent,
}: {
  value: any,
  setValue: (value: any) => void,
  context: any,
  parent: any,
}) => {
  const updateValue = (newValue: any) => {
    setValue({ ...value, ...newValue });
  };

  const dtype = value?.dtype ?? { value: 'decimal', label: 'Decimal' };
  const op = value?.op ?? { label: '==', value: 'eq' };

  return (
    <Stack direction="row" sx={{ flex: 1 }}>
      <Autocomplete
        disablePortal
        options={DATA_TYPES}
        sx={{ width: 100 }}
        value={dtype}
        isOptionEqualToValue={(option, value) => (option?.value ?? option) === (value?.value ?? value)}
        renderInput={(params) => <TextField {...params} variant="filled" label="Datatype"/>}
        onChange={(event: any, dtype: OptionType | null) => updateValue({ dtype })}
      />
      <Autocomplete
        disablePortal
        options={OPERATORS}
        sx={{ width: 80 }}
        value={op}
        isOptionEqualToValue={(option, value) => (option?.value ?? option) === (value?.value ?? value)}
        renderInput={(params) => <TextField {...params} variant="filled" label="Operator"/>}
        onChange={(event: any, op: OptionType | null) => updateValue({ op })}
      />
      <DatatypeInput
        value={value?.p1}
        setValue={(p1: any) => updateValue({ p1 })}
        dtype={dtype?.value}
        context={context}
      />
    </Stack>
  );
}

const DATA_TYPES = [
  { label: 'String', value: 'string' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Integer', value: 'integer' },
  { label: 'Decimal', value: 'decimal' },
  { label: 'Datetime', value: 'datetime' },
  { label: 'IRI', value: 'iri' },
  { label: 'URL', value: 'url' },
  { label: 'Term', value: 'term' },
];

const OPERATORS = [
  { label: '==', value: 'eq' },
  { label: '!=', value: 'neq' },
  { label: '>', value: 'gt' },
  { label: '>=', value: 'gte' },
  { label: '<', value: 'lt' },
  { label: '<=', value: 'lte' },
  { label: 'in', value: 'in' },
  { label: 'not in', value: 'nin' },
  { label: 'null', value: 'null' },
  { label: 'not null', value: 'not_null' },
]

const DatatypeInput = ({
  value: valueProp,
  setValue: setValuePartial,
  dtype,
  context,
  ...props
}: {
  value: any,
  setValue: (value: any) => void,
  dtype: string,
  context,
} | any) => {
  const label = `Input ${dtype}`;

  const setValue = (value: any) => {
    switch (dtype) {
      case 'string':
        return { termType: 'Literal', value }
      case 'boolean':
        return { termType: 'Literal', value, datatype: 'http://www.w3.org/2001/XMLSchema#boolean' }
      case 'integer':
        return { termType: 'Literal', value, datatype: 'http://www.w3.org/2001/XMLSchema#integer' }
      case 'decimal':
        return { termType: 'Literal', value, datatype: 'http://www.w3.org/2001/XMLSchema#decimal' }
      case 'datetime':
        return { termType: 'Literal', value, datatype: 'http://www.w3.org/2001/XMLSchema#dateTime' }
      case 'iri':
        return { termType: 'NamedNode', value }
      case 'url':
        return { termType: 'NamedNode', value }
    }
  }
  const value = valueProp?.value ?? valueProp;

  switch (dtype) {
    case 'string':
      return (
        <TextField
          value={value}
          onChange={e => setValue(e.target.value)}
          variant="filled"
          label={label}
          {...props}
        />
      );
    case 'boolean':
      return (
        <Checkbox
          value={value}
          onChange={(e) => setValue(e.target.checked)}
          label={label}
          {...props}
        />
      );
    case 'integer':
      return (
        <TextField
          value={value ?? 0}
          onChange={e => setValue(cleanIntegerValue(e.target.value))}
          inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
          variant="filled"
          label={label}
          {...props}
        />
      );
    case 'decimal':
      return (
        <TextField
          value={value ?? 0.0}
          onChange={e => setValue(cleanDecimalValue(e.target.value))}
          inputProps={{ inputMode: 'numeric', pattern: '[+-]?([0-9]*[.])?[0-9]+' }}
          variant="filled"
          label={label}
          {...props}
        />
      );
    case 'datetime':
      return (
        <DateTimePicker
          value={value ?? new Date()}
          onChange={(e) => setValue(e)}
          renderInput={(params) => <TextField variant="filled" {...params} />}
          label={label}
          {...props}
        />
      );
    case 'url':
    case 'iri':
      return (
        <TextField
          value={value}
          onChange={e => setValue(e.target.value)}
          variant="filled"
          label={label}
          {...props}
        />
      );
    case 'term':
      return (
        <FlexibleTermInput
          sx={{ flex: 1 }}
          pos={'OBJECT'}
          label={label}
          value={value.input}
          onChange={(input) => setValue(input)}
          context={context}
          {...props}
        />
      )

  }
}


const cleanIntegerValue = (value: any) => {
  if (typeof value === 'string') {
    return value.replace(/[^0-9\-]/g, '');
  }
  return value;
}

const cleanDecimalValue = (value: any) => {
  if (typeof value === 'string') {
    return value.replace(/[^0-9.\-]/g, '');
  }
  return value
}
