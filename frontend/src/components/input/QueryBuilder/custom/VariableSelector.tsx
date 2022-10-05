import { Autocomplete, TextField } from "@mui/material";
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { type ComponentPropsWithoutRef } from 'react';
import { type VersatileSelectorProps } from 'react-querybuilder';
import { createFilterOptions } from '@mui/material/Autocomplete';

const filter = createFilterOptions<OptionType>();


type VariableSelectorProps = VersatileSelectorProps & ComponentPropsWithoutRef<typeof Select> & {
  allowAny: boolean;
};

export const VariableSelector = ({
  className,
  handleOnChange,
  value,
  disabled,
  title,
  multiple,
  listsAsArrays,
  context,
  sx,
  // Props that should not be in extraProps'
  options: _options,
  testID: _testID,
  rules: _rules,
  level: _level,
  path: _path,
  validation: _validation,
  operator: _operator,
  field: _field,
  fieldData: _fieldData,
  allowAny = false,
  ...extraProps
}: VariableSelectorProps) => {
  const options: OptionType[] = (context.variables ?? []).map((v) => ({ label: v, value: v }));
  if (allowAny) {
    options.push({
      label: 'Any',
      value: 'any',
    })
  }

  console.log(extraProps)

  return (
    <Autocomplete
      sx={sx}
      freeSolo
      disablePortal
      value={value}
      options={options}
      onChange={(event: any, newValue: OptionType | null) => {
        handleOnChange(newValue ? {
          ...newValue as any,
          inputValue: undefined,
        } : null);
      }}
      filterOptions={(options, params) => {
        const filtered = filter(options, params);

        if (params.inputValue !== '') {
          filtered.push({
            inputValue: `Add "${params.inputValue}"`,
            value: params.inputValue,
          });
        }

        return filtered;
      }}
      getOptionLabel={(option) => {
        if (typeof option === 'string') {
          return option;
        }
        return option.value;
      }}
      renderOption={(props, option) => <li {...props}>{option?.inputValue ?? option.value}</li>}
      renderInput={(params) => <TextField
        variant="filled"
        {...params}
        label={title ?? 'Variable to filter'}
      />}

    />
  );
};

VariableSelector.displayName = 'VariableSelector';

interface OptionType {
  inputValue?: string;
  value: string;
  label?: string;
}

