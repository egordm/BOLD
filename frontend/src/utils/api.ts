import axios from "axios";


export const apiClient = axios.create({
  baseURL: process.env.API_ENDPOINT,
})

export interface PaginatedResult<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
