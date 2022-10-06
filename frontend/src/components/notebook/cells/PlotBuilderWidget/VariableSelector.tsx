import { Stack } from "@mui/material";
import React from "react";
import { GutterInput, GutterSelect } from "../../../input/GutterInput";
import { OptionType, VariableInput } from "../../../input/VariableInput";
import { AGGREGATE_FUNCTIONS, VARIABLE_DTYPE } from "./types";

export const VariableSelector = ({
  value: partialValue, setValue,
  gutterText, showDTypes, showAggs,
  variables,
  label,
  allowMultiple = true,
  defaultValue = { vars: [], aggregate: 'COUNT', dtype: 'categorical' },
}: {
  value: VariableSelectorValue,
  setValue: (value: VariableSelectorValue) => void,
  variables: string[],
  gutterText?: string,
  showDTypes?: boolean,
  showAggs?: boolean,
  allowMultiple?: boolean,
  label?: string,
  defaultValue?: VariableSelectorValue,
}) => {
  const value = { ...defaultValue, ...partialValue };
  const dtype = showDTypes ? value?.dtype : undefined;
  const aggregate = showAggs ? value?.aggregate : undefined;
  const vars = allowMultiple ? (value?.vars || []) : (value?.vars?.[0] ? [value.vars[0]] : []);

  return (
    <GutterInput
      sx={{ flex: 1 }}
      gutterProps={{ sx: { pr: 0 } }}
      gutter={
        <Stack direction="row" alignItems="center" sx={{ flex: 1 }}>
          {gutterText && <span style={{ flex: 1 }}>{gutterText.toUpperCase()}</span>}
          {showAggs && (
            <GutterSelect
              options={AGGREGATE_FUNCTIONS}
              value={aggregate ?? 'COUNT'}
              onChange={(aggregate) => setValue({ vars, aggregate, dtype })}
            />
          )}
          {showDTypes && (
            <GutterSelect
              options={VARIABLE_DTYPE}
              value={dtype}
              onChange={(dtype) => setValue({ vars, aggregate, dtype })}
            />
          )}
        </Stack>
      }
    >
      <VariableInput
        options={variables as any}
        label={label}
        allowAny={false}
        selectOnly={true}
        multiple={allowMultiple}
        value={allowMultiple ? vars : vars?.[0]}
        onChange={(vars: any) => setValue({
          vars: allowMultiple ? vars : [vars], aggregate, dtype
        })}
      />
    </GutterInput>
  )
}

export interface VariableSelectorValue {
  vars: OptionType[];
  aggregate?: string;
  dtype?: string;
}
