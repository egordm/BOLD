import _ from "lodash";
import React, { useCallback, useEffect } from "react";
import { CellId, Notebook, setCellOutputs } from "../types/notebooks";
import { useRemoteNotebookContext, useRemoteNotebookEvent } from "./RemoteNotebookProvider";


const LocalNotebookContext = React.createContext<{
  notebook: Notebook | null,
  setNotebook: (notebook: Notebook) => void,
  isUpToDate: boolean,
  focusedCell: CellId | null,
  setFocusedCell: (cellId: CellId | null) => void,
  save: (notebook: Notebook) => void,
}>(null);


export const LocalNotebookProvider = (props: {
  children: React.ReactNode,
}) => {
  const {
    children,
  } = props;

  const {
    state: {
      notebook: remoteNotebook,
      isFetching,
      save: saveRemote,
    },
  } = useRemoteNotebookContext();

  const [ notebook, setNotebook ] = React.useState<Notebook | null>(null);
  const [ focusedCell, setFocusedCell ] = React.useState<CellId | null>(null);
  const isUpToDate = _.isEqual(notebook, remoteNotebook);

  const save = useCallback((notebook: Notebook) => {
    setNotebook(notebook);
    saveRemote(notebook);
  }, [ saveRemote ]);

  useRemoteNotebookEvent('CELL_RESULT', (data: any) => {
    setNotebook(
      setCellOutputs(notebook, data.cell_id, data.outputs)
    )
  }, [ notebook ]);


  useEffect(() => {
    if (isFetching || (notebook !== null && remoteNotebook !== null)) {
      return;
    }

    if (remoteNotebook === null) {
      setNotebook({
        metadata: {
          name: '',
        },
        cells: {},
        cell_order: [],
      });
      console.debug('Initializing notebook');
    } else if (notebook === null) {
      setNotebook(remoteNotebook);
    }
  }, [ isFetching, notebook === null, remoteNotebook === null ]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    let charCode = String.fromCharCode(event.which).toLowerCase();
    if ((event.ctrlKey || event.metaKey) && charCode === 's') {
      event.preventDefault();
      save(notebook);
    }
  }

  return (
    <LocalNotebookContext.Provider value={{
      notebook, setNotebook,
      isUpToDate,
      focusedCell, setFocusedCell,
      save,
    }}>
      <div onKeyDown={onKeyDown}>
        {children}
      </div>
    </LocalNotebookContext.Provider>
  );
}

export const useLocalNotebookContext = () => {
  const context = React.useContext(LocalNotebookContext);
  if (context === null) {
    throw new Error('useContext must be used within a Provider');
  }
  return context;
};
