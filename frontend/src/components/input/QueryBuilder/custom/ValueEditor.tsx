import {
  Autocomplete, Checkbox,
  FormControl, FormControlLabel,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select, Stack,
  TextField, Typography
} from "@mui/material";
import Input from '@mui/material/Input';
import { SelectChangeEvent } from "@mui/material/Select";
import React from "react";
import {
  RuleGroupType,
  useValueEditor,
  type ValueEditorProps,
} from 'react-querybuilder';
import { FlexibleTermInput } from "../../FlexibleTermInput";
import { OperatorType } from "../types";
import FilterOperator from "./operators/FilterOperator";
import FunctionOperator from "./operators/FunctionOperator";
import LogicalOperator from "./operators/LogicalOperator";

export const ValueEditor = ({
  fieldData,
  operator,
  value,
  handleOnChange,
  title,
  className,
  type,
  inputType,
  values = [],
  listsAsArrays,
  valueSource: _vs,
  disabled,
  testID,
  context,
  parent,
  ...props
}: ValueEditorProps & { parent: RuleGroupType & { variable: any } }) => {
  useValueEditor({ handleOnChange, inputType, operator, value });

  const updateValue = (updateValue: any) => {
    handleOnChange({ ...value, ...updateValue });
  };

  switch (operator as OperatorType) {
    case 'filter':
      return (<FilterOperator
        value={value}
        setValue={updateValue}
        context={context}
        parent={parent}
      />);
    case 'datatype':
      return (
        <Autocomplete
          disablePortal
          options={DATA_TYPES}
          sx={{ flex: 1 }}
          value={value}
          isOptionEqualToValue={(option, value) => (option?.value ?? option) === (value?.value ?? value)}
          renderInput={(params) => <TextField {...params} variant="filled" label="Datatype"/>}
          onChange={(event: any, newValue: OptionType | null) => handleOnChange(newValue ? newValue : null)}
        />
      );
    case 'operator':
      return (<LogicalOperator
        value={value}
        setValue={updateValue}
        context={context}
        parent={parent}
      />);
    case 'subclass_of':
      return (<FlexibleTermInput
        sx={{ flex: 1 }}
        pos={'OBJECT'}
        label={'Subclass of'}
        value={value.input}
        onChange={(input) => updateValue({ input })}
        context={context}
      />);
    case 'function':
      return (<FunctionOperator
        value={value}
        setValue={updateValue}
        context={context}
        parent={parent}
      />);
    default:
      return (<Input
        type={'text'}
        value={value}
        title={title}
        disabled={disabled}
        className={className}
        placeholder={'Test'}
        onChange={e => handleOnChange(e.target.value)}
      />);
  }


};

ValueEditor.displayName = 'MaterialValueEditor';

interface OptionType {
  label: string,
  value: string,
}

const DATA_TYPES = [
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
];
