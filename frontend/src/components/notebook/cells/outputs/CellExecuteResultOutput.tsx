import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { CellExecuteOutput as CellExecuteOutputStructure } from "../../../../types/notebooks";
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';

export const CellExecuteResultOutput = (props: {
  output: CellExecuteOutputStructure
}) => {
  const { output, ...rest } = props;

  const content = JSON.parse(output.data['application/json'])

  const columns: GridColDef[] = content.head.vars.map((v) => ({
    field: v,
    headerName: v,
    flex: 1,
    valueGetter: (params: GridValueGetterParams) => {
      return params.row[params.field].value
    },
  }));

  const rows = content.results.bindings.map((b, i) => ({
    id: i,
    ...b,
  }));

  return (
    <Box {...rest} sx={{ height: 400, width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[5]}
      />
    </Box>
  );
}
