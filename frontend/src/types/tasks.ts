export type TaskState = 'PENDING' | 'STARTED' | 'RETRY' | 'FAILURE' | 'SUCCESS';


export interface Task {
  task_id: string;
  object_id: string;
  state: TaskState;
  created: Date;
  updated: Date;
  content_type: number;
}


export interface Packet<U, T> {
  type: U;
  data: T;
}
