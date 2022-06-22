import EditIcon from '@mui/icons-material/Edit';
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
import dayjs from "dayjs";
import { useRouter } from "next/router";
import React from "react";
import { DataGrid } from "../../components/datagrid/DataGrid";
import { DataGridToolbar } from "../../components/datagrid/DataGridToolbar";
import { Dataset } from "../../types/datasets";
import { Report } from "../../types/reports";
import { useFetchList } from "../../utils/api";
import { formatDateTime } from "../../utils/formatting";
import { ReportCreateForm } from "./ReportCreateFrom";


export const ReportsGrid = (props: {}) => {
  const router = useRouter();
  const [ addFormOpen, setAddFormOpen ] = React.useState(false);

  const {
    isLoading, isFetching,
    data, count,
    page, setPage,
    limit, setLimit,
    refresh, setQuery
  } = useFetchList<Report>('/reports/', {}, {});

  const onReportEdit = async (report: Report) => {
    await router.push(`notebook/${report.id}`);
  }

  return (
    <>
      <DataGridToolbar
        title="Reports"
        searchTitle="Search Reports"
        addTitle="Add Report"
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
              <TableCell>Name</TableCell>
              <TableCell>Dataset</TableCell>
              <TableCell>Updated At</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          )}
          renderRow={(report: Report) => (
            <TableRow hover key={report.id}>
              <TableCell>{report.notebook.metadata.name}</TableCell>
              <TableCell>{report.dataset.name}</TableCell>
              <TableCell>{dayjs(report.updated_at).fromNow()}</TableCell>
              <TableCell>{formatDateTime(report.created_at)}</TableCell>
              <TableCell>
                <IconButton aria-label="edit" onClick={async () => await onReportEdit(report)}>
                  <EditIcon/>
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
          <CardHeader title="Create Report"/>
          <CardContent>
            <ReportCreateForm onClose={(created) => {
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
