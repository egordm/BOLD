import { Container, IconButton } from "@mui/material";
import { Add } from '@mui/icons-material';
import { useCallback } from "react";
import { useNotebookContext } from "./NotebookProvider";
import { Cell } from "./structure";
import { v4 as uuidv4 } from 'uuid';


export const NotebookToolbar = (props: {}) => {
  const {
    notebook,  setNotebook,
  } = useNotebookContext();

  const addCell = useCallback(() => {
    const cell: Cell = {
      cell_type: 'code',
      source: '',
      metadata: {
        id: uuidv4()
      },
      outputs: [],
    }

    setNotebook({
      ...notebook,
      cells: {
        ...notebook?.cells,
        [cell.metadata.id]: cell,
      },
      cell_order: [
        ...notebook?.cell_order,
        cell.metadata.id,
      ],
    })
  }, [ notebook ]);

  return (
    <>
      <Container>
        <IconButton aria-label="add" size="large" onClick={addCell}>
          <Add fontSize="inherit" />
        </IconButton>
      </Container>
    </>
  );
}
