import React, { useCallback } from "react";
import useNotification from "../hooks/useNotification";
import { createWebsocketProvider, Packet } from "./WebsocketProvider";


type NotebookPacketType = 'CELL_RUN' | 'CELL_RESULT' | 'CELL_STATE';

const { useContext, useEvent, Provider } = createWebsocketProvider<NotebookPacketType, any, {}>();


export const NotebookConnectionProvider = (props: {
  reportId: string,
  children: React.ReactNode,
}) => {
  const { reportId, children, } = props;

  const { sendNotification } = useNotification();
  const [ state, setState ] = React.useState({});

  const onConnected = useCallback(() => {
    sendNotification({ variant: 'success', message: 'Connected to notebook' })
  }, []);

  const onDisconnected = useCallback(() => {
    sendNotification({ variant: 'error', message: 'Disconnected from notebook' })
  }, []);

  return (
    <Provider
      endpoint={`${process.env.WS_ENDPOINT}/ws/notebook/${reportId}/`}
      state={state}
      setState={setState}
      onSocketOpen={onConnected}
      onSocketClose={onDisconnected}
    >
      {children}
    </Provider>
  );
}

export const useNotebookConnectionContext = useContext;

export const useNotebookEvent = useEvent;
