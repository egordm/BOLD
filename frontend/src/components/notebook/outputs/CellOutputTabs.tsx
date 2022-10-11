import { Stack, Typography } from "@mui/material";
import React, { useCallback, useMemo } from "react";
import { useCellContext } from "../../../providers/CellProvider";
import { Cell, CellOutput } from "../../../types/notebooks";
import { VirtualizedTabs } from "../../layout/VirtualizedTabs";


export const CellOutputTabs = ({
  mode, options, onChange, renderResult, extraData
}: {
  options: { value: string; label: string }[];
  mode?: string;
  renderResult: (props: {
    mode: string, cell: Cell, outputs: CellOutput[] | null
  }) => JSX.Element;
  onChange: (mode: string) => void;
  extraData?: any;
}) => {
  const { cell, outputs } = useCellContext();

  return useMemo(() => {
    const renderResultTab = (mode: string) => {
      try {
        return renderResult({ mode, cell, outputs, ...extraData });
      } catch (e) {
        console.error(e);
        return (
          <Stack direction="column">
            <Typography variant="h4">Error while rendering the tab!</Typography>
            <Typography>{e.message}</Typography>
          </Stack>
        )
      }
    };

    return (
      ((outputs && outputs.length > 0) && <VirtualizedTabs
          value={mode ?? options[0].value}
          tabs={options}
          onChange={(event, value) => onChange(value)}
          renderTab={renderResultTab}
      />)
    )
  }, [ (cell as any).data?.output_mode, outputs, extraData ])
}
