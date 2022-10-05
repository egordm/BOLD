import { Stack, TextField } from "@mui/material";
import React from "react";
import { TermInput } from "../../TermInput";

export default (props) => {
  const { value, setValue, config, readonly, placeholder, customProps, fieldSettings } = props;

  const {
    propertyLabel, showObject = true, objectLabel, objectValue
  } = fieldSettings || {};
  const { property, object } = value ?? { property: [], object: [] };

  return (
    <Stack direction={"row"} spacing={2} sx={{ flex: 1 }}>
      <TermInput
        sx={{ flex: 1 }}
        datasetId={config?.settings?.notebook?.datasetId}
        pos={'PREDICATE'}
        label={propertyLabel ?? 'Take values of'}
        value={property}
        onChange={(property) => setValue({ property, object })}
        prefixes={config?.settings?.notebook?.prefixes}
        disabled={readonly}
        {...customProps}
      />
      {showObject !== false && (
        <TextField sx={{ width: 80 }} label={objectLabel} value={objectValue ?? 'Any'} variant="filled" disabled={true}/>
      )}
    </Stack>
  );
};
