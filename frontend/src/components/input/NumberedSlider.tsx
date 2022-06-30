import { Grid, Input, Slider, Stack, Typography } from "@mui/material";
import React from "react";


export const NumberedSlider = (props: {
  label: string;
} & Partial<React.ComponentProps<typeof Slider>>) => {
  const { label, onChange, value, step, min, max, ...rest } = props;

  return (
    <Stack>
      <Typography gutterBottom>{label}</Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs>
          <Slider
            defaultValue={20}
            step={step}
            value={value}
            marks
            min={1}
            max={max}
            valueLabelDisplay="auto"
            onChange={onChange}
            {...rest}
          />
        </Grid>
        <Grid item>
          <Input
            value={value}
            size="small"
            onChange={(event) => onChange(event as any, parseInt(event.target.value), 0)}
            onBlur={(event) => onChange(event as any, parseInt(event.target.value), 0)}
            inputProps={{
              step: step,
              min: min,
              max: max,
              type: 'number',
              'aria-labelledby': 'input-slider',
            }}
          />
        </Grid>
      </Grid>
    </Stack>
  )
}
