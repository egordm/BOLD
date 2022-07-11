import {
  Box, LinearProgress
} from "@mui/material";
import { GridFilterModel } from "@mui/x-data-grid/models/gridFilterModel";
import { GridValueFormatterParams } from "@mui/x-data-grid/models/params/gridCellParams";
import dayjs from "dayjs";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';

import {
  DataGrid,
  GridActionsCellItem,
  GridColDef, GridRenderCellParams,
  GridRowParams,
  GridToolbar
} from '@mui/x-data-grid';
import { ExpandableCell } from "../../components/data/ServerDataGrid";
import { ModalContainer } from "../../components/layout/ModalContainer";
import { LODCDataset } from "../../services/lodc";
import { TDBDataset, useTDBDatasets } from "../../services/triplydb";
import { formatDateTime, formatUUIDShort } from "../../utils/formatting";
import { DatasetCreateForm } from "../datasets/DatasetCreateForm";
import { TDBImportForm } from "./TDBImportForm";

const COLUMNS: GridColDef[] = [
  {
    field: 'id', headerName: 'ID', flex: 0.5,
    valueFormatter: (row) => formatUUIDShort(row.value)
  },
  {
    field: 'displayName', headerName: 'Title', flex: 1, minWidth: 200,
    renderCell: (params) => (
      <Link
        href={`https://triplydb.com/${encodeURIComponent(params.row.owner.accountName)}/${encodeURIComponent(params.row.name)}`}
        target="_blank">{params.value}</Link>
    )
  },
  {
    field: 'description', headerName: 'Description', flex: 1,
    renderCell: (params: GridRenderCellParams) => <ExpandableCell {...params} value={params.value ?? ''} maxLength={80} />,
  },
  { field: 'statements', headerName: 'Triples', flex: 0.5, type: 'number' },
  { field: 'license', headerName: 'License', flex: 0.5, },
  {
    field: 'owner', headerName: 'Owner', flex: 0.5, minWidth: 200,
    valueGetter: (row) => row.row.owner.name ?? row.row.owner.accountName,
  },
  {
    field: 'createdAt', headerName: 'Created At', flex: 0.5, type: 'dateTime', minWidth: 200,
    valueFormatter: (params) => formatDateTime(params.value)
  },
  {
    field: 'updatedAt', headerName: 'Updated At', flex: 0.5, type: 'dateTime', minWidth: 200,
    valueFormatter: (params) => (dayjs(params.value) as any).fromNow()
  },
];

export const TriplyDBGrid = (props: {}) => {
  const [ query, setQuery ] = useState<string>('');
  const [ limit, setLimit ] = useState<number>(20);
  const [ filterModel, setFilterModel ] = React.useState<GridFilterModel>({ items: [] });
  const [ openItem, setOpenItem ] = React.useState<TDBDataset | null>(null);


  useEffect(() => {
    setQuery(filterModel?.quickFilterValues?.join(' ') ?? '');
  }, [ filterModel ]);

  const { data: rows, isFetching, isLoading } = useTDBDatasets(query, limit);


  console.log(rows)

  const openImportDialog = (item: TDBDataset) => {
    setOpenItem(item);
  }

  const columns = [
    ...COLUMNS,
    {
      field: 'actions',
      type: 'actions',
      getActions: (params: GridRowParams) => [
        <GridActionsCellItem icon={<CloudDownloadIcon/>} onClick={() => openImportDialog(params.row)} label="Import"/>,
      ]
    }
  ]

  return (
    <Box sx={{ width: '100%', height: 600 }}>
      <DataGrid
        components={{
          Toolbar: GridToolbar,
          LoadingOverlay: LinearProgress
        }}
        rowCount={rows?.length ?? 0}
        paginationMode="server"
        pageSize={limit}
        onPageSizeChange={setLimit}
        rowsPerPageOptions={[ 20, 50, 100 ]}
        rows={rows as any || []}
        loading={isFetching || isLoading}
        columns={columns}
        getRowHeight={() => 'auto'}
        getEstimatedRowHeight={() => 100}
        filterMode="server"
        onFilterModelChange={setFilterModel}
        initialState={{
          columns: {
            columnVisibilityModel: {
              n_downloads_available: false,
              n_downloads_kg: false,
              n_downloads_maybekg: false,
            }
          }
        }}
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
      <ModalContainer
        title="Import TriplyDB Dataset"
        open={!!openItem}
        onClose={() => setOpenItem(null)}
      >
        <TDBImportForm dataset={openItem} onComplete={() => setOpenItem(null)} />
      </ModalContainer>
    </Box>
  )
}
