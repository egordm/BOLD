import { Card, CardContent, Divider } from "@mui/material";
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
    <Card>
      <NotebookHeader/>
      <Divider/>
      <NotebookToolbar/>
      <Divider/>
      <CardContent>
        {cells}
      </CardContent>
      {/*<TermInput datasetId={'33cb191a-b879-43ab-9667-0592acee2d21'} pos={'PREDICATE'}/>*/}
      {/*<TermInput datasetId={report?.dataset?.id} pos={'PREDICATE'}/>*/}
      {/*<TermInput datasetId={report?.dataset?.id} pos={'SUBJECT'}/>*/}
    </Card>
  );
}
