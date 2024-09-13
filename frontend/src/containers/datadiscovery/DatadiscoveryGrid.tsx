import { Box } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import { GridSortModel } from "@mui/x-data-grid/models/gridSortModel";
import { GridInitialStateCommunity } from "@mui/x-data-grid/models/gridStateCommunity";
import React from "react";
import { ServerDataGrid } from "../../components/data/ServerDataGrid";
import { formatUUIDShort } from "../../utils/formatting";

const COLUMNS: GridColDef[] = [
  {
    field: 'id', headerName: 'Dataset ID', flex: 0.5,
    valueFormatter: (params) => formatUUIDShort(params.value)
  },
  { field: 'name', headerName: 'Dataset Name', flex: 1 },
  {
    field: 'triples', headerName: 'Triples matched with search', flex: 0.5, type: 'number',
    valueGetter: (params) => {
      let total_triple_count = params.row.statistics?.triple_count
      return `${total_triple_count}/${total_triple_count}`
    },
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
  { field: 'id', sort: 'desc' }
]


export const DatadiscoveryGrid = (props: {}) => {
  return (
    <Box sx={{ width: '100%', height: 600 }}>
      <ServerDataGrid
        endpoint="/datadiscovery/"
        columns={COLUMNS}
        initialState={INITIAL_STATE}
        initialSorting={INITIAL_SORTING}
        actions={(params, actions) => []}
      />
    </Box>
  )
}
