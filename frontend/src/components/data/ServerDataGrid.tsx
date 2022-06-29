import {
  Box,
  LinearProgress
} from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams, GridToolbar } from "@mui/x-data-grid";
import { GridFilterModel } from "@mui/x-data-grid/models/gridFilterModel";
import { GridSortModel } from "@mui/x-data-grid/models/gridSortModel";
import { GridInitialStateCommunity } from "@mui/x-data-grid/models/gridStateCommunity";
import React, { useEffect } from "react";
import { Report } from "../../types/reports";
import { useFetchList } from "../../utils/api";
import Link from '@mui/material/Link';


export const ExpandableCell = ({ value, maxLength = 200 }: GridRenderCellParams & {maxLength?: number}) => {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <Box>
      {expanded ? value : value.slice(0, maxLength)}&nbsp;
      {value.length > maxLength && (
        // eslint-disable-next-line jsx-a11y/anchor-is-valid
        <Link
          type="button"
          component="button"
          sx={{ fontSize: 'inherit' }}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'view less' : 'view more'}
        </Link>
      )}
    </Box>
  );
};


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
      getRowHeight={() => 'auto'}
      getEstimatedRowHeight={() => 100}
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
      sx={{
        '&.MuiDataGrid-root--densityCompact .MuiDataGrid-cell': {
          py: 1,
          overflow: 'hidden',
        },
        '&.MuiDataGrid-root--densityStandard .MuiDataGrid-cell': {
          py: '15px',
          overflow: 'hidden',
        },
        '&.MuiDataGrid-root--densityComfortable .MuiDataGrid-cell': {
          py: '22px',
          overflow: 'hidden',
        },
      }}
    />
  )
}
