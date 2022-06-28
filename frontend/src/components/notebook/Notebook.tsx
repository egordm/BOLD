import { Card, CardContent, Divider } from "@mui/material";
import { CellProvider } from "../../providers/CellProvider";
import { useNotebookContext } from "../../providers/NotebookProvider";
import { CellId } from "../../types/notebooks";
import { CellContainer } from "./CellContainer";
import { NotebookHeader } from "./NotebookHeader";
import { NotebookToolbar } from "./NotebookToolbar";

export const Notebook = (props: {}) => {
  const {
    notebook,
  } = useNotebookContext();

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
    </Card>
  );
}
