import React, { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { Task } from "../types/tasks";
import { apiClient, PaginatedResult, WS_ENDPOINT } from "../utils/api";
import { createWebsocketProvider } from "./WebsocketProvider";

type PacketType = 'TASK_UPDATED';

const { useContext, Provider } = createWebsocketProvider<PacketType, any, Record<string, Task>>(false)

export const TasksProvider = (props: {
  children: React.ReactNode,
}) => {
  const queryClient = useQueryClient();

  const [ tasks, setTasksInternal ] = useState<Record<string, Task>>({});
  const tasksRef = React.useRef<Record<string, Task>>(tasks);

  const setTasks = useCallback((tasks: Record<string, Task>) => {
    tasksRef.current = tasks;
    setTasksInternal(tasks);
  }, []);


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
    setTasks({
      ...tasks,
      ...fetchedTasks
    });
  })

  const onMessage = useCallback((packet) => {
    if (packet.type === "TASK_UPDATED") {
      setTasks({
        ...tasksRef.current,
        [packet.data.task_id]: packet.data,
      });

      if (packet.data.content_type === "dataset") {
        queryClient.invalidateQueries('/datasets/');
      }
    }
  }, [])

  return (
    <Provider
      endpoint={`${WS_ENDPOINT}/ws/tasks/`}
      state={tasks}
      setState={setTasks}
      onMessage={onMessage}
    >
      {props.children}
    </Provider>
  );
}

export const useTasksContext = useContext;
