import React, { useCallback, useEffect, useState } from "react";
import { useQuery } from "react-query";
import { NotebookContext } from "../components/notebook/NotebookProvider";
import { Dataset } from "../types/datasets";
import { Packet, Task } from "../types/tasks";
import { apiClient, PaginatedResult } from "../utils/api";

export enum ConnectionState {
  CONNECTING = 0,
  CONNECTED = 1,
  DISCONNECTED = 2,
}

export const TasksContext = React.createContext<{
  state: ConnectionState,
  socket: WebSocket | null;
  tasks: Record<string, Task>;
}>(null);


export const TasksProvider = (props: {
  children: React.ReactNode,
}) => {
  const [ tasks, setTasks ] = useState<Record<string, Task>>({});
  const [ state, setState ] = useState<ConnectionState>(ConnectionState.CONNECTING);
  const [ socket, setSocket ] = useState<WebSocket | null>(() => null);
  const [ reconnect, setReconnect ] = useState(true);

  const { isLoading, error, data } = useQuery('GLOBAL_TASKS', async () => {
      const response = await apiClient.get<PaginatedResult<Task>>('/tasks', {
        params: {
          offset: 0,
          limit: 5,
          ordering: '-created',
        }
      });

      let fetchedTasks = {};
      response.data.results.forEach(task => {
        fetchedTasks[task.task_id] = task;
      })
      setTasks(fetchedTasks);
    }
  )



  const connect = useCallback(() => {
    const socket = new WebSocket(`ws://localhost:8000/ws/tasks/`);
    setSocket(socket);

    socket.onopen = () => {
      console.debug('Socket opened');
      setState(ConnectionState.CONNECTED);
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
      const packet: Packet<string, any> = JSON.parse(event.data);
      console.debug('Received packet', packet);
    });

    return () => {
      setReconnect(false);
      socket.close();
    };
  }, [ reconnect ]);

  useEffect(() => {
    return connect();
  }, []);

  return (
    <TasksContext.Provider value={{
      state,
      socket,
      tasks,
    }}>
      {props.children}
    </TasksContext.Provider>
  );
}

export const useTasksContext = () => {
  const context = React.useContext(TasksContext);
  if (context === null) {
    throw new Error('useTasksContext must be used within a TasksProvider');
  }
  return context;
};

export const useNotebookEvent = <T, >(type: string, callback: (content: T) => void) => {
  const { socket } = useTasksContext();

  useEffect(() => {
    const packetListener = (event: MessageEvent) => {
      const data: Packet<string, T> = JSON.parse(event.data);
      if (data.type === type) {
        callback(data.data);
      }
    };
    socket.addEventListener('message', packetListener);

    return () => {
      socket.removeEventListener('message', packetListener);
    }
  }, [ type, callback, socket ]);
}
