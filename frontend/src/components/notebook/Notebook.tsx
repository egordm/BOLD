import { Card, CardContent, Divider, Typography } from "@mui/material";
import { CellProvider } from "../../providers/CellProvider";
import { useLocalNotebookContext } from "../../providers/LocalNotebookProvider";
import { CellId } from "../../types/notebooks";
import { CellContainer } from "./cells/CellContainer";
import { NotebookHeader } from "./NotebookHeader";
import { NotebookToolbar } from "./NotebookToolbar";

export const Notebook = (props: {}) => {
  const {
    notebook,
  } = useLocalNotebookContext();

  const renderCell = (cellId: CellId) => (
    <CellProvider key={cellId} cellId={cellId}>
      <CellContainer/>
    </CellProvider>
  )

  const cells = notebook?.cell_order.map(renderCell);

  return (
    <Card
      // onKeyDown={onKeyDown}
    >
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
