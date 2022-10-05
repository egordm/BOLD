import { Autocomplete, TextField } from "@mui/material";
import { createFilterOptions } from '@mui/material/Autocomplete';
import { AutocompleteProps } from "@mui/material/Autocomplete/Autocomplete";

const filter = createFilterOptions<OptionType>();

export const VariableInput = ({
  options: variables,
  value,
  onChange,
  allowAny = false,
  label,
  ...props
}: {
  options?: string[];
  allowAny?: boolean;
  label?: string;
  value?: OptionType,
  onChange?: (value: OptionType) => void;
} & Partial<Omit<AutocompleteProps<OptionType, false, false, true>, 'onChange'>>) => {
  const options: OptionType[] = (variables ?? []).map((v) => ({ label: v, value: v }));
  if (allowAny) {
    options.push({
      label: 'Any',
      value: 'any',
    })
  }

  return (
    <Autocomplete
      freeSolo
      disablePortal
      value={value}
      options={options}
      onChange={(event: any, newValue: OptionType | null) => {
        onChange(newValue ? {
          ...newValue as any,
          inputValue: undefined,
        } : null);
      }}
      filterOptions={(options, params) => {
        const filtered = filter(options as OptionType[], params);

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
      renderOption={(props, option) =>
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

interface OptionType {
  inputValue?: string;
  value: string;
  label?: string;
}

