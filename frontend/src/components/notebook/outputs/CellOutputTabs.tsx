import React, { useMemo } from "react";
import { useCellContext } from "../../../providers/CellProvider";
import { Cell, CellOutput } from "../../../types/notebooks";
import { VirtualizedTabs } from "../../layout/VirtualizedTabs";


export const CellOutputTabs = ({
  mode, options, onChange, renderResult
}: {
  options: { value: string; label: string }[];
  mode?: string;
  renderResult: (props: {
    mode: string, cell: Cell, outputs: CellOutput[] | null
  }) => JSX.Element;
  onChange: (mode: string) => void;
}) => {
  const { cell, outputs } = useCellContext();

  return useMemo(() => (
    ((outputs && outputs.length > 0) && <VirtualizedTabs
      value={mode ?? options[0].value}
      tabs={options}
      onChange={(event, value) => onChange(value)}
      renderTab={(mode) => renderResult({ mode, cell, outputs })}
    />)
  ), [ (cell as any).data?.output_mode, outputs ])
}
