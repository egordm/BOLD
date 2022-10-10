import React from "react";
import { usePrefixes } from "../../../../providers/DatasetProvider";
import { Cell, CellOutput } from "../../../../types/notebooks";
import { cellOutputToYasgui } from "../../../../utils/yasgui";
import { Yasr } from "../../../data/Yasr";


export const ResultTab = ({
  mode, cell, outputs
}: {
  mode: string,
  cell: Cell,
  outputs: CellOutput[] | null,
}) => {
  const prefixes = usePrefixes();
  const result = cellOutputToYasgui(outputs[0]);

  return (
    <Yasr
      result={result}
      prefixes={prefixes}
    />
  )
}
