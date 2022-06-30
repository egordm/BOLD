import { Card, CardContent, Divider, Paper, Stack } from "@mui/material";
import { Box } from "@mui/system";
import { CellProvider } from "../../providers/CellProvider";
import { useNotebookContext } from "../../providers/NotebookProvider";
import { useReportContext } from "../../providers/ReportProvider";
import { CellId } from "../../types/notebooks";
import { TermInput } from "../input/TermInput";
import { CellContainer } from "./CellContainer";
import { NotebookHeader } from "./NotebookHeader";
import { NotebookToolbar } from "./NotebookToolbar";

export const Notebook = (props: {}) => {
  const { notebook, } = useNotebookContext();

  const renderCell = (cellId: CellId) => (
    <Box key={cellId}>
      <CellProvider  cellId={cellId}>
        <CellContainer/>
      </CellProvider>
      <Divider/>
    </Box>
  )

  const cells = notebook?.content?.cell_order.map(renderCell);

  return (
    <Paper>
      <Stack sx={{
        position: 'sticky',
        zIndex: 10,
        left: 0,
        right: 0,
        top: 0,
      }}>
        <Paper elevation={15}>
          <NotebookHeader/>
          <Divider/>
          <NotebookToolbar/>
        </Paper>
      </Stack>
      <Divider/>
      <CardContent>
        {cells}
      </CardContent>
    </Paper>
  );
}
