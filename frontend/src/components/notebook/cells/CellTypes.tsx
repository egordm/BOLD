import { CellOutputContainer } from "./CellOutputContainer";
import { CodeCell } from "./types/CodeCell";


export interface CellItem {
  Content: React.FC<any>;
  Output: React.FC<any>;
}

export const CELL_TYPES: Record<string, CellItem> = {
  code: {
    Content: CodeCell,
    Output: CellOutputContainer,
  }
}
