import {
  Box,
  Card,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination, TableRow
} from "@mui/material";
import PerfectScrollbar from 'react-perfect-scrollbar';
import React from "react";


export const DataGrid = <T, >(props: {
  data: T[],
  count: number,
  page: number,
  limit: number,
  renderColumns: () => JSX.Element;
  renderRow: (row: T) => JSX.Element,
  onPageChange: (page: number) => void,
  onLimitChange: (limit: number) => void,
  selectable: boolean;
  selected?: T[],
  onSelectAll?: () => void,
}) => {
  const {
    data,
    count,
    page,
    limit,
    renderColumns,
    renderRow,
    onPageChange,
    onLimitChange,
    selectable,
    selected,
    onSelectAll,
    ...rest
  } = props;


  return (
    <Card {...rest}>
      <PerfectScrollbar>
        <Box sx={{ minWidth: 1050 }}>
          <Table>
            <TableHead>
              {renderColumns()}
            </TableHead>
            <TableBody>
              {data.map(renderRow)}
            </TableBody>
          </Table>
        </Box>
      </PerfectScrollbar>
      <TablePagination
        component="div"
        count={count}
        onPageChange={(event, page) => onPageChange(page)}
        onRowsPerPageChange={(event) => onLimitChange(parseInt(event.target.value, 10))}
        page={page}
        rowsPerPage={limit}
        rowsPerPageOptions={[ 10, 20, 30 ]}
      />
    </Card>
  );
}
