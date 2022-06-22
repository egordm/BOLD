import {
  Box,
  IconButton,
  LinearProgress,
  TableCell,
  TableRow
} from "@mui/material";
import React from "react";
import { useQuery } from "react-query";
import { DataGrid } from "../../components/datagrid/DataGrid";
import { DataGridToolbar } from "../../components/datagrid/DataGridToolbar";
import { Task } from "../../types/tasks";
import { apiClient, PaginatedResult } from "../../utils/api";
import AddIcon from '@mui/icons-material/Add';
import { formatDateTime, formatUUIDShort } from "../../utils/formatting";


export const TasksGrid = (props: {}) => {
  const [ count, setCount ] = React.useState(1);
  const [ page, setPage ] = React.useState(0);
  const [ limit, setLimit ] = React.useState(20);
  const [ query, setQuery ] = React.useState("");
  const [ ordering, setOrdering ] = React.useState("-created");

  const fetchItems = async (page = 0, limit = 20, query = '', ordering = '-created') => {
    const params = {
      offset: page * limit,
      limit: limit,
      ordering: ordering,
    }

    if (query) {
      params['search'] = query;
    }

    const response = await apiClient.get<PaginatedResult<Task>>('/tasks/', { params })
    setCount(response.data.count);

    return response.data.results;
  }

  const {
    isLoading,
    isError, error,
    data,
    isFetching, refetch,
  } = useQuery(
    [ 'tasks', page, limit, query, ordering ],
    () => fetchItems(page, limit, query, ordering),
    { keepPreviousData: true }
  )

  const refresh = () => {
    setPage(0);
    refetch();
  }


  return (
    <>
      <DataGridToolbar
        title="Tasks"
        searchTitle="Search Tasks"
        onSearch={(query) => setQuery(query)}
      />

      <Box sx={{ mt: 3 }}>
        {(isLoading || isFetching) && <LinearProgress/>}
        <DataGrid
          data={data || []}
          count={count}
          page={page}
          limit={limit}
          renderColumns={() => (
            <TableRow>
              <TableCell>
                Task ID
              </TableCell>
              <TableCell>
                Name
              </TableCell>
              <TableCell>
                Object ID
              </TableCell>
              <TableCell>
                State
              </TableCell>
              <TableCell>
                Created At
              </TableCell>
            </TableRow>
          )}
          renderRow={(item) => (
            <TableRow hover key={item.task_id}>
              <TableCell>
                {formatUUIDShort(item.task_id)}
              </TableCell>
              <TableCell>
                {item.name}
              </TableCell>
              <TableCell>
                {formatUUIDShort(item.object_id)}
              </TableCell>
              <TableCell>
                {item.state}
              </TableCell>
              <TableCell>
                {formatDateTime(item.created_at)}
              </TableCell>
            </TableRow>
          )}
          onPageChange={setPage}
          onLimitChange={setLimit}
          selectable={false}/>
      </Box>
    </>
  )
}