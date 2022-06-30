import { Backdrop, CircularProgress } from "@mui/material";
import React, { useCallback, useEffect, useMemo, useState } from "react";

export interface Packet<U, T> {
  type: U;
  data: T;
}

export enum ConnectionStatus {
  CONNECTING = 0,
  CONNECTED = 1,
  DISCONNECTED = 2,
}

export const createWebsocketProvider = <U, T = any, C = any>(useBackdrop: boolean = true) => {
  const Context = React.createContext<{
    status: ConnectionStatus,
    socket: WebSocket | null,
    state: C,
    setState: (state: C) => void,
  }>(null);

  const Provider = ({
    endpoint,
    state,
    setState,
    children,
    onSocketOpen,
    onSocketClose,
    onMessage,
    reconnectDelay = 1000,
  }: {
    endpoint: string;
    state: C;
    setState: (state: C) => void;
    children: React.ReactNode;
    reconnectDelay?: number;
    onSocketOpen?: (ws: WebSocket) => void;
    onSocketClose?: () => void;
    onMessage?: (message: Packet<U, T>) => void;
  }) => {
    const [ status, setStatus ] = React.useState<ConnectionStatus>(ConnectionStatus.CONNECTING);
    const [ socket, setSocket ] = React.useState<WebSocket | null>(() => null);

    const connect = useCallback(() => {
      const socket = new WebSocket(endpoint);
      setSocket(socket);
      let reconnect = true;

      socket.onopen = () => {
        console.debug('Socket opened', endpoint);
        setStatus(ConnectionStatus.CONNECTED);
        if (onSocketOpen) {
          onSocketOpen(socket);
        }
      }

      socket.onclose = () => {
        console.debug('Socket closed', endpoint);
        setStatus(ConnectionStatus.DISCONNECTED);
        if (onSocketClose && reconnect) {
          onSocketClose();
        }

        console.debug('Schedule reconnect', endpoint);
        setTimeout(() => {
          connect();
        }, reconnectDelay);
      }

      socket.addEventListener('message', (event) => {
        const packet: Packet<U, T> = JSON.parse(event.data);
        console.debug('Received packet', packet);

        if (onMessage) {
          onMessage(packet);
        }
      });

      return () => {
        console.debug('Cancel socket', endpoint);
        reconnect = false;
        socket.onclose = () => {
          console.debug('Socket closed', endpoint);
          setStatus(ConnectionStatus.DISCONNECTED);
        };
        socket.close();
      };
    }, [ endpoint ]);

    useEffect(() => {
      return connect();
    }, [ endpoint ]);

    const contextValue = useMemo(() => ({
      status, socket, state, setState
    }), [ status, socket, state ])

    return (
      <Context.Provider value={contextValue}>
        {children}
        {useBackdrop && <Backdrop open={status !== ConnectionStatus.CONNECTED}>
            <CircularProgress color="inherit"/>
        </Backdrop>}
      </Context.Provider>
    );
  }

  const useContext = () => {
    const context = React.useContext(Context);
    if (context === null) {
      throw new Error('useContext must be used within a Provider');
    }
    return context;
  };

  const useEvent = <T, >(type: U, callback: (content: T) => void, deps = []) => {
    const { socket } = useContext();

    useEffect(() => {
      const packetListener = (event: MessageEvent) => {
        const data: Packet<U, T> = JSON.parse(event.data);
        if (data.type === type) {
          callback(data.data);
        }
      };
      socket?.addEventListener('message', packetListener);

      return () => {
        socket?.removeEventListener('message', packetListener);
      }
    }, [ type, callback, socket, ...deps ]);
  }


  return {
    Context,
    useContext,
    useEvent,
    Provider,
  }
}

