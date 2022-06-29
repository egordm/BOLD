import { Box, Container, Divider, FormControl, IconButton, InputLabel, MenuItem, Select } from "@mui/material";
import { Add } from '@mui/icons-material';
import { useCallback, useEffect, useMemo } from "react";
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
  const { focus, setFocus } = useCellFocusContext();
  const { notebook, notebookRef, setNotebook } = useNotebookContext();

  const { sendNotification } = useNotification();

  const focusCellType = focus ? notebook.content.cells[focus].cell_type : 'code';

  useEffect(() => {
    if (!focus && notebookRef.current && notebookRef.current.content.cell_order.length > 0) {
      setFocus(notebookRef.current.content.cell_order[0]);
    }
  }, [ focus === null ]);

  const onAddCell = useCallback((focus: string) => {
    const focusIdx = notebook.content.cell_order.findIndex(id => id === focus);

    const cell: Cell = {
      cell_type: 'code',
      source: '',
      metadata: {
        id: uuidv4()
      },
    }

    setNotebook(addCell(notebookRef.current, cell, focusIdx));
    sendNotification({ variant: 'success', message: 'Cell added' });
  }, []);

  const onDeleteCell = useCallback((focus: string) => {
    const focusIdx = notebook.content.cell_order.findIndex(id => id === focus);
    setNotebook(removeCell(notebookRef.current, focus));
    sendNotification({ variant: 'success', message: `Cell #${focusIdx + 1} deleted` });
  }, []);

  const onChangeCellType = useCallback((focus: string, newType: string) => {

  }, []);

  return useMemo(() => (
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
      <IconButton aria-label="add" size="large" onClick={() => onAddCell(focus)}>
        <Add fontSize="inherit"/>
      </IconButton>
      <IconButton aria-label="delete" size="large" onClick={() => onDeleteCell(focus)}>
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
      <Divider orientation="vertical" flexItem/>
      <Select
        displayEmpty
        sx={{ border: 'none' }}
        value={focusCellType}
      >
        <MenuItem value={'code'}>Code</MenuItem>
        <MenuItem value={'markdown'}>Markdown</MenuItem>
        <MenuItem value={'widget_hist'}>Histogram Widget</MenuItem>
      </Select>
    </Box>
  ), [focus, focusCellType]);
}
