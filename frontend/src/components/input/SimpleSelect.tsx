import { FormControl, FormControlProps, InputLabel, MenuItem, Select } from "@mui/material";
import { SelectProps } from "@mui/material/Select/Select";
import React from "react";
import { OptionType } from "./VariableInput";

export const SimpleSelect = ({
  value, options,
  onChange,
  formControlProps,
  label,
  ...props
}: {
  value?: string,
  onChange?: (value: string) => void,
  options?: OptionType[],
  label?: string,
  formControlProps?: Partial<FormControlProps>
} & Omit<SelectProps<OptionType>, 'onChange'|'value'>) => {
  return (
    <FormControl
      {...formControlProps}
    >
      {label && <InputLabel>{label}</InputLabel>}
      <Select
        value={value as any}
        label={label}
        onChange={(event) => onChange(
          typeof event.target.value === 'string' ? event.target.value : event.target.value.value
        )}
        {...props}
      >
        {options?.map((option) => (
          <MenuItem value={option.value} key={option.value}>
            {(option.label ?? option.value)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
