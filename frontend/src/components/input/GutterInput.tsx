import { FormControl, MenuItem, Select, Stack, StackProps } from "@mui/material";
import { SelectProps } from "@mui/material/Select/Select";
import React from "react";
import './styles.css';
import { OptionType } from "./VariableInput";

export const GutterInput = ({
  children,
  gutter,
  padGutter = true,
  sx,
  ...props
}: {
  children: React.ReactNode,
  gutter?: React.ReactNode,
  padGutter?: boolean,
} & Partial<StackProps>) => {
  return (
    <Stack
      className='flexible-term-input'
      sx={sx}
      direction="column"
      justifyContent="stretch"
      {...props}
    >
      <Stack direction="column" justifyContent="stretch">
        {children}
      </Stack>
      <Stack
        className="gutter"
        direction="row"
        justifyContent="stretch"
        sx={{
          backgroundColor: 'rgba(0, 0, 0, 0.08)',
          borderBottomLeftRadius: 4,
          borderBottomRightRadius: 4,
          height: 22,
          px: padGutter ? 1.5 : 0,
          fontSize: 11,
          pt: padGutter ? 0.2 : 0,
        }}
      >
        {gutter}
      </Stack>
    </Stack>
  );
};


export const GutterSelect = ({
  value, options,
  onChange,
  ...props
}: {
  value?: string,
  onChange?: (value: string) => void,
  options?: OptionType[],
} & Omit<SelectProps<OptionType>, 'onChange'|'value'>) => {
  return (
    <FormControl sx={{ m: 0, flex: 1, pr: 1 }} size="small" variant="standard">
      <Select
        value={value as any}
        onChange={(event) => onChange(
          typeof event.target.value === 'string' ? event.target.value : event.target.value.value
        )}
        sx={{ fontSize: 10, boxShadow: 0 }}
        disableUnderline={true}
        {...props}
      >
        {options?.map((option) => (
          <MenuItem value={option.value} key={option.value}>
            {(option.label ?? option.value).toUpperCase()}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
