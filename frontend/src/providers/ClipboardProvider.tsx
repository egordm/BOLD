import React, { useCallback, useEffect, useMemo } from "react";
import useNotification from "../hooks/useNotification";
import { Cell, Notebook } from "../types/notebooks";
import { useCellFocusContext } from "./CellFocusProvider";
import { useNotebookContext } from "./NotebookProvider";
import { useUndoHistoryContext } from "./UndoHistoryProvider";
import { v4 as uuidv4 } from 'uuid';


const ClipboardContext = React.createContext<{
  copy: () => void,
  paste: () => void,
}>(null);

export const ClipboardProvider = ({ children }: {
  children: React.ReactNode,
}) => {
  const { focusRef, setFocus } = useCellFocusContext();
  const { setNotebook } = useUndoHistoryContext();
  const { notebookRef } = useNotebookContext();
  const { sendNotification } = useNotification();

  const clipboardRef = React.useRef<Cell | null>(null);
  const setClipboard = useCallback((cell: Cell | null) => {
    clipboardRef.current = cell;
  }, []);

  const copy = useCallback(() => {
    const focusId = focusRef.current;
    const cell = focusId ? notebookRef.current.content.cells[focusId] : null;
    setClipboard(cell);
    console.debug('Copying cell', focusRef.current, cell);
    sendNotification({
      message: 'Copied cell',
      variant: 'info',
    })
  }, []);

  const paste = useCallback(() => {
    console.log(clipboardRef.current);
    if (!clipboardRef.current) {
      return;
    }

    console.debug('Pasting cell', clipboardRef.current);
    const newId = uuidv4();
    const notebook: Notebook = notebookRef.current;

    const cell_order = [ ...notebook.content.cell_order ];
    if (focusRef.current) {
      const index = cell_order.indexOf(focusRef.current);
      cell_order.splice(index + 1, 0, newId);
    } else {
      cell_order.push(newId);
    }

    setNotebook({
      ...notebookRef.current!,
      content: {
        ...notebook.content,
        cell_order,
        cells: {
          ...notebook.content.cells,
          [newId]: {
            ...clipboardRef.current,
            metadata: {
              ...clipboardRef.current.metadata,
              id: newId,
            }
          },
        }
      },
    });
    setFocus(newId);

    sendNotification({
      message: 'Pasted cell',
      variant: 'info',
    })
  }, []);

  const contextValue = useMemo(() => ({
    copy, paste,
  }), [ copy, paste ]);

  return (
    <ClipboardContext.Provider value={contextValue}>
      {children}
    </ClipboardContext.Provider>
  );
}

export const useClipboardContext = () => {
  const context = React.useContext(ClipboardContext);
  if (context === null) {
    throw new Error('useContext must be used within a Provider');
  }
  return context;
};
