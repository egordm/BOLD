export interface Notebook {
  metadata: NotebookMetadata;
  cells: Cell[];
}

export interface NotebookMetadata {
  name: string;
  database: string;
}

type Cell = {
  cell_type: CellType;
  metadata: CellMetadata;
  outputs: CellOutput[];
} & {
  cell_type: 'code';
  source: string;
} & {
  cell_type: 'markdown';
  source: string[];
}

export type CellType = 'code' | 'markdown' | string;

export interface CellMetadata {
  name: string;
  collapsed?: boolean;
  format?: string;
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
} & {
  output_type: 'execute_result';
  execution_count: number;
  data: OutputData;
} & {
  output_type: 'error';
  ename: string;
  evalue: string;
  traceback: string[];
}

export type OutputType = 'stream' | 'display_data' | 'execute_result' | 'error' | string;

export interface OutputData {
  'text/plain'?: string[];
  'image/png'?: string[];
  'application/json'?: any;
}
