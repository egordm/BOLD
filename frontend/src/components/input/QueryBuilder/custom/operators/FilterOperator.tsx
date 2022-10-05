import { Checkbox, FormControlLabel, Grid, Stack, TextField } from "@mui/material";
import React from "react";
import { FlexibleTermInput } from "../../../FlexibleTermInput";

const LABELS = {
  entity: 'For entities in',
  predicate: 'Filter values of',
  object: 'Matching values'
}


export default ({
  value,
  setValue,
  context,
  parent,
  labels: partialLabels,
}: {
  value: any,
  setValue: (value: any) => void,
  context: any,
  parent: any,
  labels?: Partial<typeof LABELS>,
}) => {
  const variable = parent?.variable?.value;
  const labels = { ...LABELS, ...partialLabels };
  const reverse = value?.reverse ?? false;
  const inputLabel = reverse ? labels.entity : labels.object;

  const updateValue = (newValue: any) => {
    setValue({ ...value, ...newValue });
  };

  return (
    <Stack direction={reverse ? 'row-reverse' : 'row'} sx={{ flex: 1 }}>
      <TextField
        sx={{ width: 100 }}
        label={reverse ? labels.object : labels.entity}
        value={variable}
        variant="filled"
        disabled={true}
      />
      <Grid container sx={{ flex: 1 }} direction={reverse ? 'row-reverse' : 'row'}>
        <Grid item sm={6}>
          <FlexibleTermInput
            sx={{ flex: 1 }}
            pos="PREDICATE"
            label={labels.predicate}
            value={value.predicate}
            onChange={(predicate) => updateValue({ predicate })}
            context={context}
          />
        </Grid>
        <Grid item sm={6}>
          <FlexibleTermInput
            sx={{ flex: 1 }}
            pos={reverse ? 'SUBJECT' : 'OBJECT'}
            label={inputLabel}
            value={value.input}
            onChange={(input) => updateValue({ input })}
            context={context}
          />
        </Grid>
      </Grid>
      <FormControlLabel
        sx={{
          position: 'absolute',
          left: 0,
          bottom: 1,
          '& .MuiFormControlLabel-label': { fontSize: 11 },
        }}
        control={<Checkbox
          size="small"
          sx={{
            '& .MuiSvgIcon-root': { fontSize: 14 },
            py: 0, pl: 2.5, pr: 0.5,
          }}
          value={reverse}
          checked={reverse}
          onChange={(e) => updateValue({ reverse: e.target.checked })}
        />}
        label="REVERSE"
      />
    </Stack>
  );
}
