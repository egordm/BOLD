import React from "react";
import { CellType } from "../../../types/notebooks";
import { CellOutputContainer } from "./CellOutputContainer";
import { CodeCellComponent } from "./types/CodeCellComponent";


export const CELL_TYPES: Record<CellType, {
  Content: React.FC<any>;
  Output: React.FC<any>;
}> = {
  code: {
    Content: CodeCellComponent,
    Output: CellOutputContainer,
  }
}
