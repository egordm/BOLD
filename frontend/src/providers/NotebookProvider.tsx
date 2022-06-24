import _ from "lodash";
import React, { useCallback, useMemo, useRef } from "react";
import { useMutation, useQuery } from "react-query";
import useNotification from "../hooks/useNotification";
import { CellId, createNotebook, Notebook, setCellOutputs } from "../types/notebooks";
import { Report } from "../types/reports";
import { apiClient } from "../utils/api";
import { useNotebookEvent } from "./NotebookConnectionProvider";


const NotebookContext = React.createContext<{
  remoteNotebook: Notebook | null,
  localNotebook: Notebook | null,
  setLocalNotebook: (notebook: Notebook) => void,
  changed: boolean,
  focusedCell: CellId | null,
  setFocusedCell: (cellId: CellId | null) => void,
  save: () => void,
  isSaving: boolean,
  refetch: () => void,
  isFetching: boolean,
}>(null);


export const NotebookProvider = (props: {
  notebookId: string,
  children: React.ReactNode,
}) => {
  const { notebookId, children, } = props;

  const { sendNotification } = useNotification();

  const [ remoteNotebook, setRemoteNotebookInternal ] = React.useState<Notebook | null>(null);
  const remoteNotebookRef = useRef<Notebook | null>(null);
  const [ localNotebook, setLocalNotebookInternal ] = React.useState<Notebook | null>(null);
  const localNotebookRef = useRef<Notebook | null>(null);

  const [ changed, setChanged ] = React.useState(false);

  const setRemoteNotebook = useCallback((notebook: Notebook) => {
    setRemoteNotebookInternal(notebook);
    remoteNotebookRef.current = notebook;
  }, []);

  const setLocalNotebook = useCallback((notebook: Notebook) => {
    setLocalNotebookInternal(notebook);
    localNotebookRef.current = notebook;
    setChanged(true);
  }, []);

  const { refetch, isFetching } = useQuery([ 'report', notebookId ], async () => {
    const response = await apiClient.get<Report>(`/reports/${notebookId}/`);
    return response.data;
  }, {
    onSuccess: (data) => {
      console.debug('Fetched notebook', data);
      setRemoteNotebook(data.notebook);

      if (remoteNotebookRef.current === null) {
        setRemoteNotebook(createNotebook(''))
      }
      if (localNotebookRef.current === null) {
        setLocalNotebook(_.cloneDeep(data.notebook));
        setChanged(false);
      }
    },
    onError: (err) => {
      sendNotification({ variant: 'error', message: `Failed to fetch notebook` });
    }
  });

  const { mutate: saveInternal, isLoading: isSaving } = useMutation(async () => {
    const response = await apiClient.put<Report>(`/reports/${notebookId}/`, { notebook: localNotebook });
    return response.data;
  }, {
    onSuccess: (output) => {
      console.debug('Saved notebook', output);
      setRemoteNotebook(output.notebook);

      if (_.isEqual(output.notebook, localNotebook)) {
        setChanged(false);
      }
    },
    onError: (err) => {
      sendNotification({ variant: 'error', message: `Failed to save notebook` });
    },
  })

  const save = () => {
    sendNotification({ variant: 'info', message: `Saving notebook` });
    saveInternal();
  }

  const [ focusedCell, setFocusedCell ] = React.useState<CellId | null>(null);

  const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    let charCode = String.fromCharCode(event.which).toLowerCase();
    if ((event.ctrlKey || event.metaKey) && charCode === 's') {
      event.preventDefault();
      save();
    }
  }, [])

  useNotebookEvent('CELL_RESULT', (data: any) => {
    setRemoteNotebook(setCellOutputs(remoteNotebookRef.current, data.cell_id, data.outputs));
    setLocalNotebook(setCellOutputs(localNotebookRef.current, data.cell_id, data.outputs));
    console.debug('Update result', remoteNotebookRef.current);
  }, [])

  const contextValue = useMemo(() => ({
    remoteNotebook, localNotebook, changed, focusedCell, isSaving, isFetching,
    setFocusedCell, save, refetch, setLocalNotebook,
  }), [ remoteNotebook, localNotebook, changed, focusedCell, isSaving, isFetching ]);

  return (
    <NotebookContext.Provider value={contextValue}>
      <div onKeyDown={onKeyDown}>
        {children}
      </div>
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
