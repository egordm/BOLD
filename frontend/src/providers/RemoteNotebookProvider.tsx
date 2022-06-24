import React, { useCallback } from "react";
import { useMutation, useQuery } from "react-query";
import useNotification from "../hooks/useNotification";
import { CellId, Notebook, setCellOutputs } from "../types/notebooks";
import { Report } from "../types/reports";
import { apiClient } from "../utils/api";
import { createWebsocketProvider, Packet } from "./WebsocketProvider";


export interface RemoteNotebookState {
  notebook: Notebook | null,
  save: (notebook: Notebook, runCells?: CellId[]) => void,
  isSaving: boolean,
  refetch: () => void,
  isFetching: boolean,
}

type NotebookPacketType = 'CELL_RUN' | 'CELL_RESULT';

const { useContext, useEvent, Provider } = createWebsocketProvider<NotebookPacketType, any, RemoteNotebookState>();


export const RemoteNotebookProvider = (props: {
  notebookId: string,
  children: React.ReactNode,
}) => {
  const { notebookId, children, } = props;

  const { sendNotification } = useNotification();
  const [ state, setState ] = React.useState<{
    notebook: Notebook | null;
  }>({
    notebook: null
  })

  const { refetch, isFetching } = useQuery([ 'report', notebookId ], async () => {
    const response = await apiClient.get<Report>(`/reports/${notebookId}/`);
    return response.data;
  }, {
    onSuccess: (data) => {
      console.debug('Fetched notebook', data);
      setState({
        notebook: data.notebook,
      })
    },
    onError: (err) => {
      sendNotification({
        variant: 'error',
        message: `Failed to fetch notebook`,
      });
    }
  });

  const { mutate: save, isLoading: isSaving } = useMutation(async (notebook: Notebook) => {
    const response = await apiClient.put<Report>(`/reports/${notebookId}/`, {
      notebook,
    });

    return response.data;
  }, {
    onSuccess: (output, data) => {
      console.debug('Saved notebook', output);
      setState({
        notebook: output.notebook,
      });
    },
    onError: (err) => {
      sendNotification({
        variant: 'error',
        message: `Failed to save notebook`,
      });
    }
  })

  const onConnected = useCallback(() => {
    sendNotification({
      variant: 'success',
      message: 'Connected to notebook',
    })
  }, []);

  const onDisconnected = useCallback(() => {
    sendNotification({
      variant: 'error',
      message: 'Disconnected from notebook',
    })
  }, []);

  const onMessage = useCallback((packet: Packet<NotebookPacketType, any>) => {
    if (packet.type === 'CELL_RESULT') {
      console.log(state)
      setState({
        notebook: setCellOutputs(state.notebook, packet.data.cell_id, packet.data.outputs),
      })
      console.debug('Update result', state);
    }
  }, [state.notebook])

  return (
    <Provider
      endpoint={`${process.env.WS_ENDPOINT}/ws/notebook/${notebookId}/`}
      state={{
        ...state,
        save: save as any,
        isSaving,
        refetch,
        isFetching,
      }}
      setState={setState}
      onMessage={onMessage}
      onSocketOpen={onConnected}
      onSocketClose={onDisconnected}
    >
      {children}
    </Provider>
  );
}

export const useRemoteNotebookContext = useContext;

export const useRemoteNotebookEvent = useEvent;
