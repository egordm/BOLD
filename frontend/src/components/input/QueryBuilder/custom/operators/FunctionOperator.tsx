import { Autocomplete, Stack, StackProps, TextField } from "@mui/material";
import { makeStyles } from "@mui/styles";
import React, { useMemo } from "react";
import { OptionType, VariableInput } from "../../../VariableInput";
import { FUNCTION_OPTIONS, FunctionType } from "../../types";

const useStyles = makeStyles((theme) => ({
  manualField: {
    flex: 1,
    "& textarea": {
      fontFamily: "monospace"
    }
  }
}));


export default ({
  value,
  setValue,
  context,
  parent,
}: {
  value: any,
  setValue: (value: any) => void,
  context: any,
  parent: any,
}) => {
  const updateValue = (newValue: any) => {
    setValue({ ...value, ...newValue });
  };

  const styles = useStyles();
  const func = value?.func ?? FUNCTION_OPTIONS[0];

  const output = value?.output ?? { value: 'main', label: 'main' };

  const input = useMemo(() => {
    switch (func?.value) {
      case 'raw':
        return (<TextField
          className={styles.manualField}
          value={value.input}
          onChange={e => updateValue({ input: e.target.value })}
          variant="filled"
          label="Raw transform"
          placeholder={"Valid SPARQL expression"}
        />)
      default:
        return null;
    }
  }, [ func, value ]);

  return (
    <Stack direction="row" sx={{ flex: 1 }}>
      <Autocomplete
        disablePortal
        options={FUNCTION_OPTIONS}
        sx={{ width: 120 }}
        value={func}
        isOptionEqualToValue={(option, value) => (option?.value ?? option) === (value?.value ?? value)}
        renderInput={(params) => <TextField {...params} variant="filled" label="Function"/>}
        onChange={(event: any, func: FunctionType | null) => updateValue({ func })}
        disableClearable={true}
      />
      {input}
      <VariableInput
        sx={{ width: 120 }}
        allowAny={false}
        value={output}
        label="Store output in"
        options={context?.variables}
        onChange={(output: OptionType) => updateValue({ output })}
      />
    </Stack>
  );
}
