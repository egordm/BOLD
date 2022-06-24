import React, { useCallback, useState } from "react";
import { useQuery } from "react-query";
import { Task } from "../types/tasks";
import { apiClient, PaginatedResult } from "../utils/api";
import { createWebsocketProvider } from "./WebsocketProvider";

export interface TasksState {
  tasks: Record<string, Task>
}

type PacketType = 'TASK_UPDATED';

const { useContext, Provider } = createWebsocketProvider<PacketType, any, TasksState>()

export const TasksProvider = (props: {
  children: React.ReactNode,
}) => {
  const [ state, setState ] = useState<TasksState>({
    tasks: {},
  });

  useQuery('GLOBAL_TASKS', async () => {
    const response = await apiClient.get<PaginatedResult<Task>>('/tasks', {
      params: {
        offset: 0,
        limit: 5,
        ordering: '-created',
        state__in: "PENDING,STARTED",
      }
    });

    let fetchedTasks = {};
    response.data.results.forEach(task => {
      fetchedTasks[task.task_id] = task;
    })
    setState({
      ...state,
      tasks: fetchedTasks,
    });
  })

  const onMessage = useCallback((packet) => {
    if (packet.type === "TASK_UPDATED") {
      setState({
        ...state,
        tasks: {
          ...state.tasks,
          [packet.data.task_id]: packet.data,
        }
      })
    }
  }, [])

  return (
    <Provider
      endpoint={`${process.env.WS_ENDPOINT}/ws/tasks/`}
      state={state}
      setState={setState}
      onMessage={onMessage}
    >
      {props.children}
    </Provider>
  );
}

export const useTasksContext = useContext;
