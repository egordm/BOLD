import { FormControlLabel, Checkbox as MuiCheckbox } from "@mui/material";
import React from "react";


export const Checkbox = ({value, label, ...rest}: {
  value: boolean;
  label: string;
} & React.ComponentProps<typeof MuiCheckbox>) => {
  return (
    <FormControlLabel
      control={<MuiCheckbox
        checked={value}
        value={value}
        {...rest}
      />}
      label={label}
    />
  )
}
