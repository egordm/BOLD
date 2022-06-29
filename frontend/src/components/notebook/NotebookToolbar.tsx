import { Box, Container, Divider, IconButton } from "@mui/material";
import { Add } from '@mui/icons-material';
import { useCallback } from "react";
import useNotification from "../../hooks/useNotification";
import { useCellFocusContext } from "../../providers/CellFocusProvider";
import { useNotebookContext } from "../../providers/NotebookProvider";
import { addCell, Cell, removeCell } from "../../types/notebooks";
import { v4 as uuidv4 } from 'uuid';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FastForwardIcon from '@mui/icons-material/FastForward';

export const NotebookToolbar = (props: {}) => {
  const { focus } = useCellFocusContext();
  const { notebook, setNotebook } = useNotebookContext();

  const { sendNotification } = useNotification();

  const focusIdx = focus ? notebook.content.cell_order.findIndex(id => id === focus) : -1;

  const onAddCell = useCallback(() => {
    const cell: Cell = {
      cell_type: 'code',
      source: '',
      metadata: {
        id: uuidv4()
      },
    }

    setNotebook(addCell(notebook, cell, focusIdx));
    sendNotification({variant: 'success', message: 'Cell added'});
  }, [ notebook, focusIdx ]);

  const onDeleteCell = useCallback(() => {
    if (!focus) return;
    setNotebook(removeCell(notebook, focus));
    sendNotification({ variant: 'success', message: `Cell #${focusIdx + 1} deleted` });
  }, [ notebook, focus ]);

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          width: 'fit-content',
          border: (theme) => `1px solid ${theme.palette.divider}`,
          borderLeftWidth: '0px',
          borderRightWidth: '0px',
          borderRadius: 1,
          bgcolor: 'background.paper',
          color: 'text.secondary',
          pl: 2,
        }}
      >
        <IconButton aria-label="add" size="large" onClick={onAddCell}>
          <Add fontSize="inherit"/>
        </IconButton>
        <IconButton aria-label="delete" size="large" onClick={onDeleteCell}>
          <DeleteIcon fontSize="inherit"/>
        </IconButton>
        <Divider orientation="vertical" flexItem/>
        <IconButton aria-label="cut" size="large">
          <ContentCutIcon fontSize="inherit"/>
        </IconButton>
        <IconButton aria-label="copy" size="large">
          <ContentCopyIcon fontSize="inherit"/>
        </IconButton>
        <IconButton aria-label="paste" size="large">
          <ContentPasteIcon fontSize="inherit"/>
        </IconButton>
        <Divider orientation="vertical" flexItem/>
        <IconButton aria-label="run" size="large">
          <PlayArrowIcon fontSize="inherit"/>
        </IconButton>
        <IconButton aria-label="runAll" size="large">
          <FastForwardIcon fontSize="inherit"/>
        </IconButton>
      </Box>
    </>
  );
}
