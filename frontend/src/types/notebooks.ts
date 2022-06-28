export type NotebookId = string;
export type CellId = string;

export interface Notebook {
  metadata: NotebookMetadata;
  content: {
    cells: Record<CellId, Cell>;
    cell_order: CellId[];
  };
  results: {
    outputs: Record<CellId, CellOutput[]>;
    states: Record<CellId, CellState>;
  }
}

export interface NotebookMetadata {
  name: string;
}

export interface CellState {
  status: 'FINISHED' | 'ERROR' | 'RUNNING' | 'QUEUED' | 'INITIAL';
}

export type CellType = 'code' | 'markdown' | 'widget' | string;

export interface CellBase {
  cell_type: CellType;
  metadata: CellMetadata;
}

export interface CellMetadata {
  id: CellId;
  collapsed?: boolean;
}

export interface CodeCellType extends CellBase {
  cell_type: 'code';
  source: string;
}

export interface MarkdownCellType extends CellBase {
  cell_type: 'markdown';
  source: string[];
}

export interface WidgetCellType extends CellBase {
  cell_type: 'widget';
  source: string[];
}

export type Cell = CodeCellType | MarkdownCellType | WidgetCellType;

export type OutputType = 'error' | 'execute_result' | 'stream' | 'display_data' | string;

export interface BaseOutput {
  output_type: OutputType;
  execution_time: number;
}

export interface CellErrorOutput extends BaseOutput {
  output_type: 'error';
  ename: string;
  evalue: string;
  traceback: string[];
}

export interface CellExecuteOutput extends BaseOutput {
  output_type: 'execute_result';
  execution_count: number;
  data: OutputData;
}

export interface CellStreamOutput extends BaseOutput {
  output_type: 'stream';
  name: string;
  text: string[];
}

export interface CellDisplayOutput extends BaseOutput {
  output_type: 'display_data';
  data: OutputData;
}

export type CellOutput = CellErrorOutput | CellExecuteOutput | CellStreamOutput | CellDisplayOutput;

export interface OutputData {
  'text/plain'?: string[];
  'image/png'?: string[];
  'application/json'?: any;
  'application/sparql-results+json'?: any;
}


export const createNotebook = (name: string): Notebook => ({
  metadata: {
    name
  },
  content: {
    cells: {},
    cell_order: []
  },
  results: {
    outputs: {},
    states: {}
  }
})

export const setCellContent = (notebook: Notebook, cellId: CellId, cell: Cell): Notebook => ({
  ...notebook,
  content: {
    ...notebook.content,
    cells: {
      ...notebook.content.cells,
      [cellId]: cell
    }
  }
})

export const setCellOutputs = (notebook: Notebook, cellId: CellId, outputs: CellOutput[]): Notebook => ({
  ...notebook,
  results: {
    ...notebook.results,
    outputs: {
      ...notebook.results.outputs,
      [cellId]: outputs
    }
  }
})

export const setCellState = (notebook: Notebook, cellId: CellId, outputs: CellState): Notebook => ({
  ...notebook,
  results: {
    ...notebook.results,
    states: {
      ...notebook.results.states,
      [cellId]: outputs
    }
  }
})

export const addCell = (notebook: Notebook, cell: Cell, index: number = -1): Notebook => {
  const cellId = cell.metadata.id;
  const cellOrder = [...notebook.content.cell_order];
  if (index === -1) {
    cellOrder.push(cellId);
  } else {
    cellOrder.splice(index, 0, cellId);
  }

  return {
    ...notebook,
    content: {
      ...notebook.content,
      cells: {
        ...notebook.content.cells,
        [cellId]: cell
      },
      cell_order: cellOrder
    }
  }
}
