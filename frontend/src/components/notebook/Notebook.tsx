import { Card, CardContent, CardHeader, Divider, Input, TextField } from "@mui/material";
import { Cell } from "./cells/Cell";
import { CellProvider } from "./cells/CellProvider";
import { useNotebookContext } from "./NotebookProvider";
import { NotebookToolbar } from "./NotebookToolbar";
import { CellId } from "./structure";

export const Notebook = (props: {}) => {
  const {
    notebook,
    setTitle,
    save,
  } = useNotebookContext();

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    let charCode = String.fromCharCode(event.which).toLowerCase();
    if ((event.ctrlKey || event.metaKey) && charCode === 's') {
      event.preventDefault();
      save();
    }
  }

  const renderCell = (cellId: CellId) => (
    <CellProvider key={cellId} cellId={cellId}>
      <Cell/>
    </CellProvider>
  )

  const cells = notebook?.cell_order.map(renderCell);

  return (notebook &&
      <Card onKeyDown={onKeyDown}>
          <CardHeader
            // title={notebook?.metadata?.name}
              title={
                <Input
                  fullWidth
                  value={notebook?.metadata?.name}
                  onChange={(event) => {
                    setTitle(event.target.value)
                    console.log(notebook.metadata.name)
                  }}
                />
              }
          />
          <Divider/>
          <NotebookToolbar/>
          <Divider/>
          <CardContent>
            {cells}
          </CardContent>
      </Card>
  );
}
