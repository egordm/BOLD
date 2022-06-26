import {
  Box,
  LinearProgress
} from "@mui/material";
import { DataGrid, GridColDef, GridToolbar } from "@mui/x-data-grid";
import { GridFilterModel } from "@mui/x-data-grid/models/gridFilterModel";
import { GridSortModel } from "@mui/x-data-grid/models/gridSortModel";
import { GridInitialStateCommunity } from "@mui/x-data-grid/models/gridStateCommunity";
import React, { useEffect } from "react";
import { Report } from "../../types/reports";
import { useFetchList } from "../../utils/api";


export const ServerDataGrid = (props: {
  endpoint: string,
  columns: GridColDef[],
  initialState: GridInitialStateCommunity,
  initialSorting: GridSortModel,
  initialFilter?: GridFilterModel,
} & Partial<React.ComponentProps<typeof DataGrid>>) => {
  const {
    endpoint, columns, initialState, initialSorting, initialFilter, ...rest
  } = props;

  const [ filterModel, setFilterModel ] = React.useState<GridFilterModel>(initialFilter ?? { items: [] });
  const [ sortModel, setSortModel ] = React.useState<GridSortModel>(initialSorting ?? []);

  const {
    isLoading, isFetching,
    data: rows, count,
    page, setPage,
    limit, setLimit,
    setQuery,
    setOrdering,
  } = useFetchList<Report>(endpoint, {}, {});


  useEffect(() => {
    const model = sortModel.length ? sortModel : initialSorting;
    const direction = model[0].sort === 'desc' ? '-' : '';
    const field = model[0].field;
    setOrdering(`${direction}${field}`);
  }, [ sortModel, initialSorting ]);

  useEffect(() => {
    setQuery(filterModel?.quickFilterValues?.join(' ') ?? '');
  }, [ filterModel ]);

  return (
    <DataGrid
      {...rest}
      rows={rows || []}
      rowCount={count}
      loading={isLoading || isFetching}
      pagination
      page={page}
      pageSize={limit}
      paginationMode="server"
      onPageChange={setPage}
      onPageSizeChange={setLimit}
      columns={columns}
      rowsPerPageOptions={[ 20, 50, 100 ]}
      filterMode="server"
      onFilterModelChange={setFilterModel}
      sortingMode="server"
      onSortModelChange={setSortModel}
      components={{
        Toolbar: GridToolbar,
        LoadingOverlay: LinearProgress
      }}
      initialState={initialState}
      componentsProps={{
        toolbar: {
          showQuickFilter: true,
          quickFilterProps: { debounceMs: 500 },
        },
      }}
    />
  )
}
