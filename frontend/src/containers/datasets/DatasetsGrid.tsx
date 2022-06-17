import {
  Box,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  LinearProgress,
  Modal,
  TableCell,
  TableRow
} from "@mui/material";
import React from "react";
import { useQuery } from "react-query";
import { DataGrid } from "../../components/datagrid/DataGrid";
import { DataGridToolbar } from "../../components/datagrid/DataGridToolbar";
import { Dataset } from "../../types/datasets";
import { apiClient, PaginatedResult } from "../../utils/api";
import { DatasetCreateForm } from "./DatasetCreateForm";
import AddIcon from '@mui/icons-material/Add';


export const DatasetsGrid = (props: {}) => {
  const [ addFormOpen, setAddFormOpen ] = React.useState(false);

  const [ count, setCount ] = React.useState(1);
  const [ page, setPage ] = React.useState(0);
  const [ limit, setLimit ] = React.useState(20);
  const [ query, setQuery ] = React.useState("");
  const [ ordering, setOrdering ] = React.useState("-created_at");


  const fetchItems = async (page = 0, limit = 20, query = '', ordering = '-created_at') => {
    const params = {
      offset: page * limit,
      limit: limit,
      ordering: ordering,
    }

    if (query) {
      params['search'] = query;
    }

    const response = await apiClient.get<PaginatedResult<Dataset>>('/datasets/', { params })
    setCount(response.data.count);

    return response.data.results;
  }

  const {
    isLoading,
    isError,
    error,
    data,
    isFetching,
    refetch,
  } = useQuery(
    [ 'datasets', page, limit, query, ordering ],
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
        addTitle="Add Dataset"
        onAdd={() => setAddFormOpen(true)}
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
                Name
              </TableCell>
              <TableCell>
                Description
              </TableCell>
              <TableCell>
                Source
              </TableCell>
              <TableCell>
                Database
              </TableCell>
              <TableCell>
                Created At
              </TableCell>
              <TableCell>
                Actions
              </TableCell>
            </TableRow>
          )}
          renderRow={(dataset) => (
            <TableRow hover key={dataset.id}>
              <TableCell>
                {dataset.name}
              </TableCell>
              <TableCell>
                {dataset.description}
              </TableCell>
              <TableCell>
                {dataset.source}
              </TableCell>
              <TableCell>
                {dataset.database}
              </TableCell>
              <TableCell>
                {dataset.created_at.toLocaleString()}
              </TableCell>
              <TableCell>
                <IconButton aria-label="delete">
                  <AddIcon/>
                </IconButton>
              </TableCell>
            </TableRow>
          )}
          onPageChange={setPage}
          onLimitChange={setLimit}
          selectable={false}/>
      </Box>
      <Modal
        open={addFormOpen}
        onClose={() => setAddFormOpen(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Card sx={{
          width: 600,
          position: 'absolute' as 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}>
          <CardHeader title="Import Dataset"/>
          <CardContent>
            <DatasetCreateForm onClose={(created) => {
              setAddFormOpen(false);
              if (created) {
                refresh();
              }
            }}/>
          </CardContent>
        </Card>
      </Modal>
    </>
  )
}
