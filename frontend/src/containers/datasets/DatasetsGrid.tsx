import {
  Box
} from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import { GridSortModel } from "@mui/x-data-grid/models/gridSortModel";
import { GridInitialStateCommunity } from "@mui/x-data-grid/models/gridStateCommunity";
import React from "react";
import { ServerDataGrid } from "../../components/data/ServerDataGrid";
import { formatDateTime } from "../../utils/formatting";

const COLUMNS: GridColDef[] = [
  {
    field: 'id', headerName: 'ID', flex: 0.5,
  },
  { field: 'name', headerName: 'Name', flex: 1 },
  { field: 'description', headerName: 'Description', flex: 1 },
  { field: 'database', headerName: 'Database', flex: 0.5 },
  { field: 'state', headerName: 'State', flex: 0.5, type: 'singleSelect' },
  {
    field: 'triples', headerName: 'Triples', flex: 0.5, type: 'number',
    valueGetter: (params) => params.row.statistics?.triple_count,
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
      database: true,
      updated_at: false,
    }
  }
}

const INITIAL_SORTING: GridSortModel = [
  { field: 'created_at', sort: 'desc' }
]


export const DatasetsGrid = (props: {}) => {
  return (
    <Box sx={{ width: '100%', height: 600 }}>
      <ServerDataGrid
        endpoint="/datasets/"
        columns={COLUMNS}
        initialState={INITIAL_STATE}
        initialSorting={INITIAL_SORTING}
      />
    </Box>
  )
}
