export type NotebookId = string;
export type CellId = string;

export const createNotebook = (name: string): Notebook => ({
  metadata: {
    name
  },
  cells: {},
  cell_order: []
})

export interface Notebook {
  metadata: NotebookMetadata;
  cells: Record<CellId, Cell>;
  cell_order: CellId[];
}

export interface NotebookMetadata {
  name: string;
}

export interface CellBase {
  cell_type: CellType;
  metadata: CellMetadata;
  outputs: CellOutput[];
  state: CellState;
}

export interface CodeCell extends CellBase {
  cell_type: "code";
  source: string;
}

export interface MarkdownCell extends CellBase {
  cell_type: "markdown";
  source: string[];
}

export type Cell = CodeCell | MarkdownCell;

export type CellType = 'code' | 'markdown' | string;

export interface CellMetadata {
  id: CellId;
  collapsed?: boolean;
  format?: string;
}

export interface CellState {
  status: 'finished' | 'error' | 'running' | 'queued' | 'unknown';
}

export interface CellErrorOutput {
  output_type: 'error';
  ename: string;
  evalue: string;
  traceback: string[];
}

export interface CellExecuteOutput {
  output_type: 'execute_result';
  execution_count: number;
  data: OutputData;
}

export type CellOutput = {
  output_type: OutputType;
} & {
  output_type: 'stream';
  name: string;
  text: string[];
} & {
  output_type: 'display_data';
  data: OutputData;
} | CellExecuteOutput | CellErrorOutput

export type OutputType = 'stream' | 'display_data' | 'execute_result' | 'error' | string;

export interface OutputData {
  'text/plain'?: string[];
  'image/png'?: string[];
  'application/json'?: any;
}

export const setCellOutputs = (notebook: Notebook, cellId: CellId, outputs: CellOutput[]) => ({
  ...notebook,
  cells: {
    ...notebook.cells,
    [cellId]: {
      ...notebook.cells[cellId],
      outputs: outputs,
    }
  }
})
