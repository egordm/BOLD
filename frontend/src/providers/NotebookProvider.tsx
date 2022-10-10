import _ from "lodash";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { usePrompt } from "../hooks/usePrompt";
import useNotification from "../hooks/useNotification";
import {
  Cell,
  createNotebook,
  Notebook,
  setCellContent,
  setCellOutputs,
  setCellState
} from "../types/notebooks";
import { useNotebookEvent } from "./NotebookConnectionProvider";
import { useReportContext } from "./ReportProvider";


const NotebookContext = React.createContext<{
  notebook: Notebook | null,
  notebookRef: React.MutableRefObject<Notebook | null>,
  setNotebook: (notebook: Notebook) => void,
  setCell: (cell: Cell) => void,
  changed: boolean,
  save: () => void,
  isSaving: boolean,
  isFetching: boolean,
}>(null);

const UNSAVED_MESSAGE = 'You have unsaved changes. Are you sure you want to leave?';

export const NotebookProvider = ({
  children,
}: {
  children: React.ReactNode,
}) => {
  const [ changed, setChangedInternal ] = React.useState(false);
  const changedRef = useRef(changed);
  const setChanged = (value: boolean) => {
    changedRef.current = value;
    setChangedInternal(value);
  }

  // Unsaved changes warning when navigating away
  usePrompt(UNSAVED_MESSAGE, changed);

  // Unsaved changes warning when tab is closed
  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => {
      if(changedRef.current) {
        (e || window.event).returnValue = UNSAVED_MESSAGE; //Gecko + IE
        return UNSAVED_MESSAGE; //Gecko + Webkit, Safari, Chrome etc.
      }
    }

    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, []);

  const [ notebook, setNotebookInternal ] = React.useState<Notebook | null>(null);
  const notebookRef = useRef<Notebook | null>(null);

  const { sendNotification } = useNotification();

  const setNotebook = useCallback((notebook: Notebook) => {
    setNotebookInternal(notebook);
    notebookRef.current = notebook;
  }, []);

  const setCell = useCallback((cell: Cell) => {
    setNotebook(setCellContent(notebookRef.current!, cell.metadata.id, cell));
  }, []);

  const { report, reportRef, isSaving, isFetching, save: saveReport } = useReportContext();
  const save = useCallback(() => {
    // TODO: Save notebook
    saveReport({
      ...reportRef.current,
      notebook: notebookRef.current,
    });
  }, []);

  useEffect(() => {
    if (!isFetching) {
      if (report?.notebook) {
        console.log('Updating notebook', report.notebook);
        if (!notebookRef.current) {
          setNotebook(report.notebook);
        }
        // setNotebook(report.notebook);
      } else {
        setNotebook(createNotebook('Untitled notebook'));
      }
    }
  }, [ report === null, isFetching ]);

  useEffect(() => {
    if (notebookRef.current && report.notebook) {
      const changedLocal = !_.isEqual(notebookRef.current, report.notebook);
      if (changedLocal !== changed) {
        setChanged(changedLocal);
      }
    }
  }, [ !changed ? report?.notebook?.content : null, !changed ? notebook : null, isSaving ]);

  useNotebookEvent('CELL_RESULT', (data: any) => {
    setNotebook(setCellOutputs(notebookRef.current, data.cell_id, data.outputs));
    console.debug('Added cell result', notebookRef.current);

    const errored = data.outputs.some(output => output.output_type === 'error');
    const cellIdx = notebookRef.current?.content?.cell_order?.findIndex(cellId => cellId === data.cell_id) ?? -1;
    if (data.outputs.length > 0) {
      if (errored) {
        sendNotification({ variant: 'error', message: `Cell #${cellIdx + 1} run failed` });
      } else {
        sendNotification({ variant: 'success', message: `Cell #${cellIdx + 1} run succeeded` });
      }
    }
  }, []);

  useNotebookEvent('CELL_STATE', (data: any) => {
    setNotebook(setCellState(notebookRef.current, data.cell_id, data.state));
    console.debug('Added cell state', notebookRef.current);
  }, []);

  useEffect(() => {
    const keyDownHandler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        save();
      }
    }

    document.addEventListener('keydown', keyDownHandler);
    return () => {
      document.removeEventListener('keydown', keyDownHandler);
    }
  }, []);

  const contextValue = useMemo(() => ({
    notebook, notebookRef, setNotebook, setCell, changed, save, isSaving, isFetching,
  }), [ notebook, changed, isSaving, isFetching ]);

  return (
    <NotebookContext.Provider value={contextValue}>
      {children}
    </NotebookContext.Provider>
  );
}

export const useNotebookContext = () => {
  const context = React.useContext(NotebookContext);
  if (context === null) {
    throw new Error('useContext must be used within a Provider');
  }
  return context;
};
