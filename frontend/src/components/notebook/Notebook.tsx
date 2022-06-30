import { Card, CardContent, Divider, Paper, Stack } from "@mui/material";
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
    <CellProvider key={cellId} cellId={cellId}>
      <CellContainer/>
    </CellProvider>
  )

  const cells = notebook?.content?.cell_order.map(renderCell);

  return (
    <Paper>
      <Stack sx={{
        position: 'sticky',
        zIndex: 100,
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
      {/*<TermInput datasetId={'33cb191a-b879-43ab-9667-0592acee2d21'} pos={'PREDICATE'}/>*/}
      {/*<TermInput datasetId={report?.dataset?.id} pos={'PREDICATE'}/>*/}
      {/*<TermInput datasetId={report?.dataset?.id} pos={'SUBJECT'}/>*/}
    </Paper>
  );
}
