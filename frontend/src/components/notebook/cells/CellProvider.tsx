import React, { useCallback, useEffect } from "react";
import { NotebookContext, PacketType, useNotebookContext } from "../NotebookProvider";
import { Cell, CellId } from "../structure";

export const CellContext = React.createContext<{
  cell: Cell | null;
  setCell: (cell: Cell) => void;
  runCell: () => void;
}>(null);

export const CellProvider = (props: {
  cellId: CellId,
  children: React.ReactNode,
}) => {
  const [ cell, setCell ] = React.useState<Cell | null>(null);
  const { socket, notebook, setNotebook, save } = useNotebookContext();

  useEffect(() => {
    if (notebook) {
      setCell(notebook.cells[props.cellId]);
    }
  }, [ notebook, props.cellId ]);

  const runCell = useCallback(() => {
    save();
    socket.send(JSON.stringify({
      type: PacketType.CELL_RUN,
      data: cell.metadata.id,
    }));

    console.debug('Running cell', cell);
  }, [ socket, cell ]);

  const updateCell = useCallback((cell) => {
    setCell(cell);
    setNotebook({
      ...notebook,
      cells: {
        ...notebook.cells,
        [cell.metadata.id]: cell,
      }
    })
  }, [notebook, setNotebook]);

  return (
    <CellContext.Provider value={{
      cell,
      setCell: updateCell,
      runCell,
    }}>
      {props.children}
    </CellContext.Provider>
  );
}

export const useCellContext = () => {
  const context = React.useContext(CellContext);
  if (context === null) {
    throw new Error('useCellContext must be used within a CellProvider');
  }
  return context;
};
