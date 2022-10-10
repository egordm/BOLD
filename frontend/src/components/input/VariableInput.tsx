import { Autocomplete, TextField } from "@mui/material";
import { createFilterOptions } from '@mui/material/Autocomplete';
import { AutocompleteProps } from "@mui/material/Autocomplete/Autocomplete";
import _ from "lodash";

const filter = createFilterOptions<OptionType>();

const DEFAULT_VALUE = {value: 'main', label: 'main'};

export const VariableInput = ({
  options: variables,
  value,
  onChange,
  allowAny = false,
  selectOnly = false,
  multiple = false,
  defaultValue: defaultValuePartial,
  label,
  ...props
}: {
  options?: string[];
  allowAny?: boolean;
  label?: string;
  value?: OptionType | OptionType[];
  onChange?: (value: OptionType | OptionType[]) => void;
  selectOnly?: boolean;
  multiple?: boolean;
  defaultValue?: OptionType | OptionType[];
} & Partial<Omit<Omit<AutocompleteProps<OptionType, boolean, false, boolean>, 'onChange'>, 'option'>>) => {
  const options: OptionType[] = (variables ?? []).map((v) => ({ label: v, value: v }));
  if (allowAny) {
    options.push({
      label: 'Any',
      value: 'any',
    })
  }

  const defaultValue = defaultValuePartial ?? (multiple ? [DEFAULT_VALUE] : DEFAULT_VALUE);

  return (
    <Autocomplete
      freeSolo={!selectOnly}
      multiple={multiple}
      disablePortal
      disableClearable={true}
      value={value}
      defaultValue={defaultValue}
      options={options}
      onChange={(event: any, newValue: OptionType | OptionType[] | string | null) => {
        onChange(_.isArray(newValue)
          ? newValue
          : newValue
            ? {
              ...newValue as any,
              inputValue: undefined,
            }
            : null
        );
      }}
      isOptionEqualToValue={(option: any, value: any) => (option?.value ?? option) === (value?.value ?? value)}
      filterOptions={(options, params) => {
        const filtered = filter(options as OptionType[], params);

        if (!selectOnly && params.inputValue !== '') {
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
        return (option as OptionType).value;
      }}
      renderOption={(props, option: OptionType | string) =>
        <li {...props}>{typeof option === 'string'
          ? option
          : (option?.inputValue ?? option.value)}
        </li>
      }
      renderInput={(params) => <TextField
        variant="filled"
        {...params}
        label={label ?? 'Variable to filter'}
      />}
      {...props}
    />
  );
};

export interface OptionType {
  inputValue?: string;
  value: string;
  label?: string;
}

