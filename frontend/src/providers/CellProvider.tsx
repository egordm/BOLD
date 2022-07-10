import React, { useCallback, useEffect, useMemo } from "react";
import { Cell, CellId, CellOutput, CellState, setCellState } from "../types/notebooks";
import { useCellFocusContext } from "./CellFocusProvider";
import { useNotebookConnectionContext } from "./NotebookConnectionProvider";
import { useNotebookContext } from "./NotebookProvider";
import { useRunQueueContext } from "./RunQueueProvider";

export const CellContext = React.createContext<{
  cell: Cell;
  cellRef: React.RefObject<Cell>;
  state: CellState | null;
  outputs: CellOutput[] | null;
  setCell: (cell: Cell) => void;
  runCell: () => void;
}>(null);

export const CellProvider = (props: {
  cellId: CellId,
  children: React.ReactNode,
}) => {
  const { cellId } = props;

  const { runCells } = useRunQueueContext();
  const { socket } = useNotebookConnectionContext();
  const { focus, setFocus } = useCellFocusContext();
  const { notebook, notebookRef, setNotebook, setCell } = useNotebookContext();
  const cellRef = React.useRef<Cell>(null);

  const cell = notebook?.content?.cells[cellId];
  const state = notebook?.results?.states[cellId] || null;
  const outputs = notebook?.results?.outputs[cellId] || null;
  cellRef.current = cell;

  const runCell = useCallback(() => {
    setNotebook(setCellState(notebookRef.current!, cellId, { status: 'QUEUED', }));
    runCells([cellId]);
  }, [ socket ]);

  const onFocus = useCallback((event) => {
    if (focus !== cellId) {
      setFocus(cellId);
    }
  }, [focus, cellId]);

  const contextValue = useMemo(() => ({
    cell, cellRef, state, outputs, setCell, runCell,
  }), [ cell, state, outputs ]);

  return (
    <CellContext.Provider value={contextValue}>
      <div onClick={onFocus}>
        {props.children}
      </div>
    </CellContext.Provider>
  );
}

export const useCellContext = () => {
  const context = React.useContext(CellContext);
  if (context === null) {
    throw new Error('useContext must be used within a Provider');
  }
  return context;
};
