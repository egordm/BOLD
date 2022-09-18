import { Axios } from "axios";
import { useState } from "react";
import { useQuery, UseQueryOptions } from "react-query";
import { useApi } from "../hooks/useApi";



export interface PaginatedResult<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface PaginationParams {
  page: number;
  limit: number;
  query: string;
  ordering: string;
}

export const apiFetchList = <T, >(
  apiClient: Axios,
  endpoint: string,
  updateCountFn: (count: number) => void
) => (
  async (page = 0, limit = 20, query = '', ordering = '-created_at', filters = undefined) => {
    const params = {
      offset: page * limit,
      limit: limit,
      ordering: ordering,
      ...filters,
    }

    if (query) {
      params['search'] = query;
    }

    const response = await apiClient.get<PaginatedResult<T>>(endpoint, { params })
    updateCountFn(response.data.count);

    return response.data.results;
  }
)

export const useFetchList = <T, >(
  endpoint: string,
  pagination: Partial<PaginationParams>,
  options: UseQueryOptions<T[]>,
  filters = undefined
) => {
  const [ count, setCount ] = useState(1);
  const [ page, setPage ] = useState(pagination.page ?? 0);
  const [ limit, setLimit ] = useState(pagination.limit ?? 20);
  const [ query, setQuery ] = useState(pagination.query ?? "");
  const [ ordering, setOrdering ] = useState(pagination.ordering ?? "-updated_at");

  const apiClient = useApi();

  const fetchItems = apiFetchList<T>(apiClient, endpoint, setCount);

  const result = useQuery(
    [ endpoint, page, limit, query, ordering, filters ],
    () => fetchItems(page, limit, query, ordering, filters),
    { ...options, keepPreviousData: true }
  )

  const refresh = () => {
    setPage(0);
    result.refetch();
  }

  return {
    ...result,
    count,
    page, setPage,
    limit, setLimit,
    query, setQuery,
    ordering, setOrdering,
    refresh,
  }
}
