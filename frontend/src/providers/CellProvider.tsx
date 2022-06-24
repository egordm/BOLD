import React, { useCallback, useEffect } from "react";
import useNotification from "../hooks/useNotification";
import { Cell, CellId, setCellOutputs } from "../types/notebooks";
import { useLocalNotebookContext } from "./LocalNotebookProvider";
import { useRemoteNotebookContext } from "./RemoteNotebookProvider";
import { ConnectionStatus } from "./WebsocketProvider";

export const CellContext = React.createContext<{
  cell: Cell | null;
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
  const { socket, status } = useRemoteNotebookContext();
  const { notebook, setNotebook, isUpToDate, save } = useLocalNotebookContext();
  const [ run, setRun ] = React.useState(false);

  const cell = notebook.cells[cellId];
  const running = run || cell.state?.status === "queued" || cell.state?.status === "running";

  const setCell = useCallback((cell) => {
    setNotebook({
      ...notebook,
      cells: {
        ...notebook.cells,
        [cell.metadata.id]: cell,
      }
    })
  }, [ notebook, setNotebook ]);

  const runCell = useCallback(() => {
    setRun(true);
    save(setCellOutputs(notebook, cellId, []));
  }, [ socket, cell ]);

  useEffect(() => {
    if (isUpToDate && run && status === ConnectionStatus.CONNECTED) {
      console.debug('Running cell', cell.metadata.id);
      setRun(false);
      socket.send(JSON.stringify({
        type: 'CELL_RUN',
        data: cell.metadata.id,
      }));
      sendNotification({
        variant: 'info',
        message: 'Running cell',
      })

    }
  }, [ isUpToDate, run ]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.shiftKey && event.key === 'Enter') {
      event.preventDefault();
      runCell();
    }
  }

  return (
    <CellContext.Provider value={{
      cell, setCell,
      runCell,
      running,
    }}>
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
