import {
  Box
} from "@mui/material";
import { GridColDef} from "@mui/x-data-grid";
import { GridSortModel } from "@mui/x-data-grid/models/gridSortModel";
import { GridInitialStateCommunity } from "@mui/x-data-grid/models/gridStateCommunity";
import React from "react";
import { ServerDataGrid } from "../../components/data/ServerDataGrid";
import { formatDateTime, formatUUIDShort } from "../../utils/formatting";


const COLUMNS: GridColDef[] = [
  {
    field: 'task_id', headerName: 'Task ID', flex: 0.5,
    valueFormatter: (params) => formatUUIDShort(params.value)
  },
  { field: 'name', headerName: 'Name', flex: 1 },
  {
    field: 'object_id', headerName: 'Object ID', flex: 0.5,
    valueFormatter: (params) => formatUUIDShort(params.value)
  },
  { field: 'state', headerName: 'State', flex: 0.5 },
  {
    field: 'content_type', headerName: 'Namespace', flex: 0.5,
    valueGetter: (params) => params.value.model
  },
  {
    field: 'creator', headerName: 'Creator', flex: 0.5,
    valueGetter: (params) => params.value?.username
  },
  {
    field: 'created_at', headerName: 'Created At', flex: 0.5, type: 'dateTime', minWidth: 200,
    valueFormatter: (params) => formatDateTime(params.value)
  },
  {
    field: 'updated_at', headerName: 'Updated At', flex: 0.5, type: 'dateTime', minWidth: 200,
    valueFormatter: (params) => formatDateTime(params.value)
  },
]

const INITIAL_STATE: GridInitialStateCommunity = {
  columns: {
    columnVisibilityModel: {
      updated_at: false,
    }
  }
}

const INITIAL_SORTING: GridSortModel = [
  { field: 'created_at', sort: 'desc' }
]


export const TasksGrid = (props: {}) => {
  return (
    <Box sx={{ width: '100%', height: 600 }}>
      <ServerDataGrid
        endpoint="/tasks/"
        columns={COLUMNS}
        initialState={INITIAL_STATE}
        initialSorting={INITIAL_SORTING}
        getRowId={(row) => row.task_id}
        />
    </Box>
  )
}
