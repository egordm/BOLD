import { Container, IconButton } from "@mui/material";
import { Add } from '@mui/icons-material';
import { useCallback } from "react";
import { useNotebookContext } from "../../providers/NotebookProvider";
import { addCell, Cell } from "../../types/notebooks";
import { v4 as uuidv4 } from 'uuid';


export const NotebookToolbar = (props: {}) => {
  const { notebook, setNotebook } = useNotebookContext();

  const onAddCell = useCallback(() => {
    const cell: Cell = {
      cell_type: 'code',
      source: '',
      metadata: {
        id: uuidv4()
      },
    }

    setNotebook(addCell(notebook, cell));
  }, [ notebook ]);

  return (
    <>
      <Container>
        <IconButton aria-label="add" size="large" onClick={onAddCell}>
          <Add fontSize="inherit"/>
        </IconButton>
      </Container>
    </>
  );
}
