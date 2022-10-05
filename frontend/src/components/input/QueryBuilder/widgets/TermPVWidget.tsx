import { FormControl, InputLabel, MenuItem, Select, Stack, TextField } from "@mui/material";
import _ from "lodash";
import React from "react";
import { TermInput } from "../../TermInput";

export default (props) => {
  const { value, setValue, config, readonly, placeholder, customProps, fieldSettings } = props;

  const {
    propertyLabel, objectLabel
  } = fieldSettings || {};
  const { property, objectVar } = value ?? { property: [], objectVar: 'var1' };

  return (
    <Stack direction={"row"} spacing={2} sx={{ flex: 1 }}>
      <TermInput
        sx={{ flex: 1 }}
        datasetId={config?.settings?.notebook?.datasetId}
        pos={'PREDICATE'}
        label={propertyLabel ?? 'Take values of'}
        value={property}
        onChange={(property) => setValue({ property, objectVar })}
        prefixes={config?.settings?.notebook?.prefixes}
        disabled={readonly}
        {...customProps}
      />
      <FormControl variant="filled" sx={{ minWidth: 80 }}>
        <InputLabel>{objectLabel}</InputLabel>
        <Select
          sx={{ width: 80 }}
          label={objectLabel}
          value={objectVar ?? 'var1'}
          variant="filled"
          onChange={(e) => setValue({ property, objectVar: e.target.value })}
        >
          {_.range(1, 10).map((i) => (
            <MenuItem value={`var${i}`}>{`var${i}`}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
};
