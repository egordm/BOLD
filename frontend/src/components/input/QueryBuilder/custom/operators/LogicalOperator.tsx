import { DateTimePicker } from "@mui/lab";
import { Autocomplete, Stack, StackProps, TextField } from "@mui/material";
import { makeStyles } from "@mui/styles";
import React, { useMemo } from "react";
import { Checkbox } from "../../../Checkbox";
import { FlexibleTermInput } from "../../../FlexibleTermInput";
import { OptionType } from "../../../VariableInput";
import { DType, OpType } from "../../types";

const useStyles = makeStyles((theme) => ({
  manualField: {
    "& textarea": {
      fontFamily: "monospace"
    }
  }
}));


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

  const datatypeInput = useMemo(() => (
    <Autocomplete
      disablePortal
      options={DTYPES_OPTIONS}
      sx={{ width: 130 }}
      value={dtype}
      isOptionEqualToValue={(option, value) => (option?.value ?? option) === (value?.value ?? value)}
      renderInput={(params) => <TextField {...params} variant="filled" label="Datatype"/>}
      onChange={(event: any, dtype: OptionType | null) => updateValue({ dtype })}
      disableClearable={true}
    />
  ), [ dtype ]);

  const input = useMemo(() => {
    switch (op.value) {
      case 'null':
      case 'not_null':
        return null;
      default:
        return (
          <Stack direction="row" sx={{flex: 1}}>
            {datatypeInput}
            <DatatypeInput
              sx={{ flex: 1 }}
              value={value?.p1}
              setValue={(p1: any) => updateValue({ p1 })}
              dtype={dtype?.value}
              context={context}
              label={`Input ${dtype?.value}`}
            />
          </Stack>
        )
    }
  }, [ value ]);

  return (
    <Stack direction="row" sx={{ flex: 1 }}>
      <Autocomplete
        disablePortal
        options={LOGICAL_OPERATORS_OPTIONS}
        sx={{ width: 120 }}
        value={op}
        isOptionEqualToValue={(option, value) => (option?.value ?? option) === (value?.value ?? value)}
        renderInput={(params) => <TextField {...params} variant="filled" label="Operator"/>}
        onChange={(event: any, op: OptionType | null) => updateValue({ op })}
        disableClearable={true}
      />
      {input}
    </Stack>
  );
}

const DTYPES_OPTIONS: OptionType<DType>[] = [
  { label: 'String', value: 'string' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Integer', value: 'integer' },
  { label: 'Decimal', value: 'decimal' },
  { label: 'Datetime', value: 'datetime' },
  { label: 'URL/IRI', value: 'url' },
  { label: 'Term', value: 'term' },
];

const LOGICAL_OPERATORS_OPTIONS: OptionType<OpType>[] = [
  { label: '==', value: 'eq' },
  { label: '!=', value: 'neq' },
  { label: '>', value: 'gt' },
  { label: '>=', value: 'gte' },
  { label: '<', value: 'lt' },
  { label: '<=', value: 'lte' },
  { label: 'null', value: 'null' },
  { label: 'not null', value: 'not_null' },
  { label: 'raw', value: 'raw' },
];

const DatatypeInput = ({
  value: valueProp,
  setValue: setValue,
  dtype,
  label,
  context,
  ...props
}: {
  value: any,
  setValue: (value: any) => void,
  dtype: string,
  label?: string,
  context,
} | any) => {
  const styles = useStyles();
  const value = valueProp?.value ?? valueProp;

  switch (dtype) {
    case 'raw':
    case 'string':
      return (
        <TextField
          className={styles.manualField}
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
          ampm={false}
          renderInput={(params) => <TextField sx={{ flex: 1 }} variant="filled" {...params} />}
          label={label}
          {...props}
        />
      );
    case 'url':
      return (
        <TextField
          className={styles.manualField}
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
          pos={'SUBJECT'}
          label={label}
          value={value}
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
