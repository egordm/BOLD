import React, { useCallback, useEffect, useMemo } from "react";
import useNotification from "../hooks/useNotification";
import { Cell, CellId, setCellOutputs } from "../types/notebooks";
import { useLocalNotebookContext } from "./LocalNotebookProvider";
import { useNotebookConnectionContext } from "./NotebookConnectionProvider";
import { useNotebookContext } from "./NotebookProvider";
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
  const { socket, status } = useNotebookConnectionContext();
  const { remoteNotebook, localNotebook, setLocalNotebook, changed, save } = useNotebookContext();
  const [ run, setRun ] = React.useState(false);

  const remoteCell = remoteNotebook?.cells[cellId];

  const cell = {
    ...localNotebook.cells[cellId],
    outputs: remoteCell?.outputs ?? [],
    state: remoteCell?.state ?? localNotebook.cells[cellId].state,
  };
  const running = run || cell.state?.status === "queued" || cell.state?.status === "running";

  const setCell = useCallback((cell) => {
    setLocalNotebook({
      ...localNotebook,
      cells: {
        ...localNotebook.cells,
        [cell.metadata.id]: cell,
      }
    })
  }, [ localNotebook ]);

  const runCell = useCallback(() => {
    setRun(true);
    setLocalNotebook(setCellOutputs(localNotebook, cellId, []))
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
      sendNotification({
        variant: 'info',
        message: 'Running cell',
      })

    }
  }, [ changed, run ]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.shiftKey && event.key === 'Enter') {
      event.preventDefault();
      runCell();
    }
  }

  const contextValue = useMemo(() => ({
    cell, setCell,
    runCell,
    running,
  }), [ cell, running ]);

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
