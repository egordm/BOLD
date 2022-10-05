import { Stack } from "@mui/material";
import React from "react";
import { TermInput } from "../../TermInput";

export default (props) => {
  const { value, setValue, config, readonly, placeholder, customProps, fieldDefinition } = props;

  const {
    propertyLabel, objectLabel
  } = fieldDefinition?.fieldSettings || {};
  const { property, object } = value ?? { property: [], object: [] };

  return (
    <Stack direction={"row"} spacing={2} sx={{ flex: 1 }}>
      <TermInput
        sx={{ flex: 1 }}
        datasetId={config?.settings?.notebook?.datasetId}
        pos={'PREDICATE'}
        label={propertyLabel ?? 'Filter values of'}
        value={property}
        onChange={(property) => setValue({ property, object })}
        prefixes={config?.settings?.notebook?.prefixes}
        disabled={readonly}
        {...customProps}
      />
      <TermInput
        sx={{ flex: 1 }}
        datasetId={config?.settings?.notebook?.datasetId}
        pos={'OBJECT'}
        label={objectLabel ?? 'Matching values'}
        value={object}
        onChange={(object) => setValue({ property, object })}
        prefixes={config?.settings?.notebook?.prefixes}
        disabled={readonly}
        {...customProps}
      />
    </Stack>
  );
};
