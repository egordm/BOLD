import React, { useCallback, useEffect, useMemo } from "react";
import useNotification from "../hooks/useNotification";
import { Cell, CellId, CellOutput, CellState } from "../types/notebooks";
import { useNotebookConnectionContext } from "./NotebookConnectionProvider";
import { useNotebookContext } from "./NotebookProvider";
import { ConnectionStatus } from "./WebsocketProvider";

export const CellContext = React.createContext<{
  cell: Cell;
  state: CellState | null;
  outputs: CellOutput[] | null;
  setCell: (cell: Cell) => void;
  runCell: () => void;
  running: boolean;
}>(null);

export const CellProvider = (props: {
  cellId: CellId,
  children: React.ReactNode,
}) => {
  const { cellId } = props;

  const { sendNotification } = useNotification();
  const { socket, status } = useNotebookConnectionContext();
  const { notebook, setCell, changed, save } = useNotebookContext();
  const [ run, setRun ] = React.useState(false);

  const cell = notebook?.content?.cells[cellId];
  const state = notebook?.results?.states[cellId] || null;
  const outputs = notebook?.results?.outputs[cellId] || null;

  const running = run || state?.status === "QUEUED" || state?.status === "RUNNING";

  const runCell = useCallback(() => {
    setRun(true);
    save();
  }, [ socket, cell ]);

  useEffect(() => {
    if (!changed && run && status === ConnectionStatus.CONNECTED) {
      console.debug('Running cell', cell.metadata.id);
      setRun(false);
      socket.send(JSON.stringify({
        type: 'CELL_RUN',
        data: cell.metadata.id,
      }));
      sendNotification({ variant: 'info', message: 'Running cell' })

    }
  }, [ changed, run ]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.shiftKey && event.key === 'Enter') {
      event.preventDefault();
      runCell();
    }
  }

  const contextValue = useMemo(() => ({
    cell, state, outputs, setCell, runCell, running,
  }), [ cell, state, outputs, running ]);

  return (
    <CellContext.Provider value={contextValue}>
      <div onKeyDown={onKeyDown}>
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
