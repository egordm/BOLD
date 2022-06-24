import { Container, IconButton } from "@mui/material";
import { Add } from '@mui/icons-material';
import { useCallback } from "react";
import { useLocalNotebookContext } from "../../providers/LocalNotebookProvider";
import { useNotebookContext } from "../../providers/NotebookProvider";
import { Cell } from "../../types/notebooks";
import { v4 as uuidv4 } from 'uuid';


export const NotebookToolbar = (props: {}) => {
  const {
    localNotebook, setLocalNotebook,
  } = useNotebookContext();

  const addCell = useCallback(() => {
    const cell: Cell = {
      cell_type: 'code',
      source: '',
      metadata: {
        id: uuidv4()
      },
      state: {
        status: 'finished',
      },
      outputs: [],
    }

    setLocalNotebook({
      ...localNotebook,
      cells: {
        ...localNotebook?.cells,
        [cell.metadata.id]: cell,
      },
      cell_order: [
        ...localNotebook?.cell_order,
        cell.metadata.id,
      ],
    })
  }, [ localNotebook ]);

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
