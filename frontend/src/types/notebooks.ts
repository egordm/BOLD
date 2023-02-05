import { v4 as uuidv4 } from 'uuid';


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

export type CellTypeWidget = `widget_${string}`;

export type CellType = 'code' | 'markdown' | CellTypeWidget | string;

export interface CellBase {
  cell_type: CellType;
  metadata: CellMetadata;
}

export interface CellMetadata {
  id: CellId;
  collapsed?: boolean;
  timeout?: number;
}

export interface CodeCellType extends CellBase {
  cell_type: 'code';
  source: string;
}

export interface MarkdownCellType extends CellBase {
  cell_type: 'markdown';
  source: string;
  preview: string;
}


export interface WidgetCellType<D = any> extends CellBase {
  cell_type: CellTypeWidget;
  data: D;
  source: string[];
}

export type Cell = CodeCellType | MarkdownCellType | WidgetCellType;

export type OutputType = 'error' | 'execute_result' | 'stream' | 'display_data' | string;

export interface BaseOutput {
  output_type: OutputType;
  execution_time?: number;
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
  snapshot?: any;
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

export const createCell = (cellType: CellType, metadata?: CellMetadata, prev_data?: Cell): Cell => {
  metadata = metadata ?? { id: uuidv4() }

  if (cellType === 'code') {
    return {
      cell_type: 'code',
      metadata,
      source: 'SELECT * \n{ ?s ?p ?o } \nLIMIT 10'
    }
  } else if (cellType === 'markdown') {
    return {
      cell_type: 'markdown',
      metadata,
      source: '# Markdown cell',
      preview: 'live'
    }
  } else if (cellType === 'widget_plotbuilder' || 'widget_querybuilder') {
    return {
      cell_type: cellType as any,
      metadata,
      source: [],
      data: {
        tree: (prev_data as any)?.data?.tree,
      }
    }
  } else if (cellType.startsWith('widget_')) {
    return {
      cell_type: cellType as any,
      metadata,
      source: [],
      data: {}
    }
  }
}

export const setCellContent = (notebook: Notebook, cellId: CellId, cell: Cell): Notebook => ({
  ...notebook,
  content: {
    ...notebook.content,
    cells: {
      ...notebook.content.cells,
      [cellId]: cell
    }
  },
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

export const setCellState = (notebook: Notebook, cellId: CellId, state: Partial<CellState>): Notebook => ({
  ...notebook,
  results: {
    ...notebook.results,
    states: {
      ...notebook.results.states,
      [cellId]: {
        ...notebook.results.states[cellId],
        ...state,
      }
    }
  }
})

export const setCellMeta = (notebook: Notebook, cellId: CellId, meta: Partial<CellMetadata>): Notebook => ({
  ...notebook,
  content: {
    ...notebook.content,
    cells: {
      ...notebook.content.cells,
      [cellId]: {
        ...notebook.content.cells[cellId],
        metadata: {
          ...notebook.content.cells[cellId].metadata,
          ...meta
        }
      }
    }
  }
})

export const addCell = (notebook: Notebook, cell: Cell, index: number = -1): Notebook => {
  const cellId = cell.metadata.id;
  const cellOrder = [ ...notebook.content.cell_order ];
  if (index === -1) {
    cellOrder.push(cellId);
  } else {
    cellOrder.splice(index + 1, 0, cellId);
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
    },
    results: {
      outputs: {
        ...notebook.results.outputs,
        [cellId]: []
      },
      states: {
        ...notebook.results.states,
        [cellId]: {
          status: 'INITIAL'
        }
      },
    }
  }
}

export const removeCell = (notebook: Notebook, cellId: CellId): Notebook => {
  const cellOrder = [ ...notebook.content.cell_order ];
  const index = cellOrder.indexOf(cellId);
  if (index !== -1) {
    cellOrder.splice(index, 1);
  }

  const cells = { ...notebook.content.cells };
  delete cells[cellId];

  return {
    ...notebook,
    content: {
      ...notebook.content,
      cells,
      cell_order: cellOrder
    }
  }
}

export const setCellCollapsed = (cell: Cell, collapsed: boolean): Cell => {
  return {
    ...cell,
    metadata: {
      ...cell.metadata,
      collapsed
    }
  }
}
