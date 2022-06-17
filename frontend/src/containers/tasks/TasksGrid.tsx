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
        title="Datasets"
        searchTitle="Search Datasets"
        onSearch={(query) => setQuery(query)}
      />

      <Box sx={{ mt: 3 }}>
        {(isLoading || isFetching) && <LinearProgress/>}
        <DataGrid
          data={data || []}
          count={count}
          page={page}
          limit={limit}
          renderColumns={() => [
            <TableCell>
              Task ID
            </TableCell>,
            <TableCell>
              Object ID
            </TableCell>,
            <TableCell>
              State
            </TableCell>,
            <TableCell>
              Created At
            </TableCell>,
          ]}
          renderRow={(item) => (
            <TableRow hover key={item.task_id}>
              <TableCell>
                {item.task_id.substring(0, 6)}
              </TableCell>
              <TableCell>
                {item.object_id.substring(0, 6)}
              </TableCell>
              <TableCell>
                {item.state}
              </TableCell>
              <TableCell>
                {item.created.toLocaleString()}
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
