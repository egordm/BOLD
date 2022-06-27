import React from "react";
import { OutputType } from "../../../types/notebooks";
import { CellErrorOutput } from "./outputs/CellErrorOutput";
import { CellExecuteResultOutput } from "./outputs/CellExecuteResultOutput";


export const OUTPUT_TYPES: Record<OutputType, React.FC<any>> = {
  'error': CellErrorOutput,
  'execute_result': CellExecuteResultOutput,
}
