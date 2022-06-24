import { CellErrorOutput } from "./outputs/CellErrorOutput";
import { CellExecuteResultOutput } from "./outputs/CellExecuteResultOutput";


export const CELL_OUTPUT_TYPES: Record<string, React.FC<any>> = {
  'error': CellErrorOutput,
  'execute_result': CellExecuteResultOutput,
}
