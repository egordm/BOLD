import throttle from "lodash/throttle";
import React, { useCallback, useEffect, useMemo } from "react";
import { Cell, Notebook } from "../types/notebooks";
import { useNotebookContext } from "./NotebookProvider";


export interface UndoHistory {
  undo: (Notebook['content'])[],
  redo: (Notebook['content'])[],
}

const HISTORY_LIMIT = 10;

const UndoHistoryContext = React.createContext<{
  setNotebook: (notebook: Notebook) => void,
  setCell: (cell: Cell) => void,
  undo: () => void,
  redo: () => void,
}>(null);

export const UndoHistoryProvider = ({ children }: {
  children: React.ReactNode,
}) => {
  const [ history, setHistoryInternal ] = React.useState<UndoHistory>({ undo: [], redo: [] });
  const historyRef = React.useRef<UndoHistory>(history);

  const setHistory = useCallback((history: UndoHistory) => {
    setHistoryInternal(history);
    historyRef.current = history;
  }, []);

  const { notebookRef, setNotebook: setNotebookInternal, setCell: setCellInternal } = useNotebookContext();

  const checkpointHistory = useCallback(throttle(() => {
    const undo = historyRef.current.undo.slice();
    undo.push(notebookRef.current!.content);
    if (undo.length > HISTORY_LIMIT) {
      undo.shift();
    }
    setHistory({ undo, redo: [] });
    console.log('Checkpointed history');
  }, 1000), []);

  const setNotebook = useCallback((notebook: Notebook) => {
    checkpointHistory();
    setNotebookInternal(notebook);
  }, []);

  const setCell = useCallback((cell: Cell) => {
    checkpointHistory();
    setCellInternal(cell);
  }, []);

  const undo = useCallback(() => {
    const undo = historyRef.current.undo.slice();
    const redo = historyRef.current.redo.slice();
    const current = undo.pop();
    if (current) {
      redo.push(notebookRef.current!.content);
      setNotebookInternal({ ...notebookRef.current!, content: current });
    }
    setHistory({ undo, redo });
  }, []);

  const redo = useCallback(() => {
    const undo = historyRef.current.undo.slice();
    const redo = historyRef.current.redo.slice();
    const current = redo.pop();
    if (current) {
      undo.push(notebookRef.current!.content);
      setNotebookInternal({ ...notebookRef.current!, content: current });
    }
    setHistory({ undo, redo });
  }, []);

  useEffect(() => {
    const keyDownHandler = (event: KeyboardEvent) => {
      if ([ 'textarea', 'input' ].includes(document.activeElement?.tagName?.toLowerCase())) {
        return;
      }

      if (event.ctrlKey && event.key === 'z') {
        event.preventDefault();
        undo();
      }
      if (event.ctrlKey && event.key === 'y') {
        event.preventDefault();
        redo();
      }
    }

    document.addEventListener('keydown', keyDownHandler);
    return () => {
      document.removeEventListener('keydown', keyDownHandler);
    }
  }, []);

  const contextValue = useMemo(() => ({
    setNotebook, setCell, undo, redo,
  }), []);

  return (
    <UndoHistoryContext.Provider value={contextValue}>
      {children}
    </UndoHistoryContext.Provider>
  );
}

export const useUndoHistoryContext = () => {
  const context = React.useContext(UndoHistoryContext);
  if (context === null) {
    throw new Error('useContext must be used within a Provider');
  }
  return context;
};
