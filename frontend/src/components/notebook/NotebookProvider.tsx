import React, { useCallback, useEffect, useState } from "react";
import { Cell, Notebook, NotebookId } from "./structure";

export enum PacketType {
  NOTEBOOK_REQUEST = 'NOTEBOOK_REQUEST',
  NOTEBOOK_DATA = 'NOTEBOOK_DATA',
  NOTEBOOK_SAVE = 'NOTEBOOK_SAVE',
  CELL_RUN = 'CELL_RUN',
}

export interface Packet<T> {
  type: PacketType;
  data: T;
}

export enum ConnectionState {
  CONNECTING = 0,
  CONNECTED = 1,
  DISCONNECTED = 2,
}

export const NotebookContext = React.createContext<{
  state: ConnectionState,
  socket: WebSocket | null;
  notebook: Notebook | null;
  setNotebook: (notebook: Notebook) => void;
  setTitle: (title: string) => void;
  save: () => void;
}>(null);


export const NotebookProvider = (props: {
  notebookId: NotebookId,
  children: React.ReactNode,
}) => {
  const [ state, setState ] = useState<ConnectionState>(ConnectionState.CONNECTING);
  const [ socket, setSocket ] = useState<WebSocket | null>(() => null);
  const [ notebook, setNotebook ] = useState<Notebook | null>(() => null);
  const [ reconnect, setReconnect ] = useState(true);

  const connect = useCallback(() => {
    const socket = new WebSocket(`ws://localhost:8000/ws/notebook/${props.notebookId}/`);
    setSocket(socket);

    socket.onopen = () => {
      console.debug('Socket opened');
      setState(ConnectionState.CONNECTED);
      socket.send(JSON.stringify({
        type: PacketType.NOTEBOOK_REQUEST,
      }))
    }

    socket.onclose = () => {
      console.debug('Socket closed');
      setState(ConnectionState.DISCONNECTED);
      if (reconnect) {
        console.debug('Schedule reconnect');
        setTimeout(() => {
          connect();
        }, 1000);
      }
    }

    socket.addEventListener('message', (event) => {
      const packet: Packet<Notebook> = JSON.parse(event.data);
      console.debug('Received packet', packet);
      if (packet.type === PacketType.NOTEBOOK_DATA) {
        console.debug('Received notebook', packet.data);
        setNotebook(packet.data);
      }
    });

    return () => {
      setReconnect(false);
      socket.close();
    };
  }, [ reconnect, props.notebookId ]);

  useEffect(() => {
    return connect();
  }, [ props.notebookId ]);

  const save = useCallback(() => {
    console.debug('Saving notebook', notebook);
    socket.send(JSON.stringify({
      type: PacketType.NOTEBOOK_SAVE,
      data: notebook,
    }));
  }, [ notebook ]);

  const setTitle = useCallback((title: string) => {
    setNotebook({
      ...notebook,
      metadata: {
        ...notebook?.metadata,
        name: title,
      }
    })
  }, [ notebook ]);

  return (
    <NotebookContext.Provider value={{
      state,
      socket,
      notebook,
      setNotebook,
      setTitle,
      save,
    }}>
      {props.children}
    </NotebookContext.Provider>
  );
}

export const useNotebookContext = () => {
  const context = React.useContext(NotebookContext);
  if (context === null) {
    throw new Error('useNotebookContext must be used within a NotebookProvider');
  }
  return context;
};

export const useNotebookEvent = <T, >(type: PacketType, callback: (content: T) => void) => {
  const { socket } = useNotebookContext();

  useEffect(() => {
    const packetListener = (event: MessageEvent) => {
      const data: Packet<T> = JSON.parse(event.data);
      if (data.type === type) {
        callback(data.content);
      }
    };
    socket.addEventListener('message', packetListener);

    return () => {
      socket.removeEventListener('message', packetListener);
    }
  }, [ type, callback, socket ]);
}
