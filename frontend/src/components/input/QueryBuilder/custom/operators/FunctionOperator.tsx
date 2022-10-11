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

  const input = value?.input ?? { value: 'main', label: 'main' };
  const output = value?.output ?? { value: 'main', label: 'main' };

  const Input = useMemo(() => {
    switch (func?.value) {
      case 'raw':
        return (<TextField
          className={styles.manualField}
          value={value.rawFn}
          onChange={e => updateValue({ rawFn: e.target.value })}
          variant="filled"
          label="Raw transform"
          placeholder={"Valid SPARQL expression"}
        />)
      case 'lang':
      case 'simplify':
        return (<VariableInput
          sx={{ flex: 1 }}
          allowAny={false}
          value={input}
          label="Input variable"
          options={context?.variables}
          onChange={(input: OptionType) => updateValue({ input })}
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
        sx={{ width: 140 }}
        value={func}
        isOptionEqualToValue={(option, value) => (option?.value ?? option) === (value?.value ?? value)}
        renderInput={(params) => <TextField {...params} variant="filled" label="Function"/>}
        onChange={(event: any, func: FunctionType | null) => updateValue({ func })}
        disableClearable={true}
      />
      {Input}
      <VariableInput
        sx={Input ? { width: 120 } : { flex: 1 }}
        allowAny={false}
        value={output}
        label="Store output in"
        options={context?.variables}
        onChange={(output: OptionType) => updateValue({ output })}
      />
    </Stack>
  );
}
