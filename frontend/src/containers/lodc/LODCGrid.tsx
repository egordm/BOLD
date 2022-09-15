import {
  Box, Card, CardContent, CardHeader, LinearProgress, Link, Modal
} from "@mui/material";
import React from "react";
import { useQuery } from "react-query";
import { ExpandableCell } from "../../components/data/ServerDataGrid";
import { useApi } from "../../hooks/useApi";
import { fetchLODCDatasets, LODCDataset } from "../../services/lodc";
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';

import {
  DataGrid,
  GridActionsCellItem,
  GridColDef,
  GridRenderCellParams,
  GridRowParams,
  GridToolbar
} from '@mui/x-data-grid';

import { LODCImportForm } from "./LODCImportForm";

const COLUMNS: GridColDef[] = [
  { field: 'identifier', headerName: 'ID', flex: 0.5 },
  {
    field: 'title', headerName: 'Title', flex: 1, minWidth: 200,
    renderCell: (params) => (
      <Link
        href={`https://lod-cloud.net/dataset/${encodeURIComponent(params.row.identifier)}`}
        target="_blank">{params.value}</Link>
    )
  },
  {
    field: 'description', headerName: 'Description', flex: 1,
    valueGetter: (row) => row.row.description.en ?? '',
    renderCell: (params: GridRenderCellParams) => <ExpandableCell {...params} maxLength={80} />,
  },
  { field: 'domain', headerName: 'Domain', flex: 0.5 },
  { field: 'website', headerName: 'Website', flex: 0.5 },
  {
    field: 'triples', headerName: 'Triples', flex: 0.5, type: 'number',
    valueGetter: (row) => row.row.triples ? row.row.triples.toString().replaceAll(/[.,]/g, '') : null
  },
  { field: 'n_downloads_available', headerName: 'Downloads Available', type: 'number' },
  { field: 'n_downloads_kg', headerName: 'Downloads KG', type: 'number' },
  { field: 'n_downloads_maybekg', headerName: 'Downloads Maybe KG', type: 'number' },
  { field: 'n_kg_available', headerName: 'KG Available', type: 'number', width: 180 },
];

export const LODCGrid = (props: {}) => {
  const apiClient = useApi();
  const { data: rows } = useQuery<LODCDataset[]>('lodc-datasets', fetchLODCDatasets(apiClient));
  const [ openItem, setOpenItem ] = React.useState<LODCDataset | null>(null);

  const openImportDialog = (item: LODCDataset) => {
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
        rows={rows || []}
        loading={!rows}
        columns={columns}
        getRowHeight={() => 'auto'}
        getEstimatedRowHeight={() => 100}
        initialState={{
          filter: {
            filterModel: {
              items: [ { columnField: 'n_kg_available', operatorValue: '>', value: '0' } ],
            },
          },
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
      <Modal
        open={openItem !== null}
        onClose={() => setOpenItem(null)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Card sx={{
          width: 600,
          position: 'absolute' as 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          maxHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <CardHeader title="Import LODC Dataset"/>
          <CardContent sx={{ overflow: 'auto', flex: 1 }}>
            <LODCImportForm
              dataset={openItem}
              onComplete={(created) => {
                setOpenItem(null);
              }}
            />
          </CardContent>
        </Card>
      </Modal>
    </Box>
  )
}
