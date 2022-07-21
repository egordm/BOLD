import {
  Autocomplete,
  Box,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select, TextField
} from "@mui/material";
import { Add } from '@mui/icons-material';
import { useCallback, useEffect, useMemo } from "react";
import useNotification from "../../hooks/useNotification";
import { useCellFocusContext } from "../../providers/CellFocusProvider";
import { useNotebookContext } from "../../providers/NotebookProvider";
import { useRunQueueContext } from "../../providers/RunQueueProvider";
import { addCell, createCell, removeCell, setCellContent, setCellMeta } from "../../types/notebooks";
import { v4 as uuidv4 } from 'uuid';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FastForwardIcon from '@mui/icons-material/FastForward';
import { ClassTreeWidget } from "./cells/ClassTreeWidget";

export const NotebookToolbar = (props: {}) => {
  const { focus, focusRef, setFocus } = useCellFocusContext();
  const { notebook, notebookRef, setNotebook } = useNotebookContext();
  const { runCells } = useRunQueueContext();

  const { sendNotification } = useNotification();

  const focusCell = focus ? notebook.content.cells[focus] : null;
  const focusCellType = focusCell?.cell_type ?? 'code';
  const focusCellTimeout = focusCell?.metadata?.timeout ?? 5000;

  useEffect(() => {
    if (!focus && notebookRef.current && notebookRef.current.content.cell_order.length > 0) {
      setFocus(notebookRef.current.content.cell_order[0]);
    }
  }, [ focus === null ]);

  const onAddCell = useCallback(() => {
    const focusIdx = notebookRef.current?.content?.cell_order?.findIndex(id => id === focusRef.current) ?? -1;

    const cell = createCell('code');
    setNotebook(addCell(notebookRef.current, cell, focusIdx));
    sendNotification({ variant: 'success', message: 'Cell added' });
  }, []);

  const onDeleteCell = useCallback(() => {
    const focusIdx = notebookRef.current?.content?.cell_order?.findIndex(id => id === focusRef.current) ?? -1;

    setNotebook(removeCell(notebookRef.current, focusRef.current));
    sendNotification({ variant: 'success', message: `Cell #${focusIdx + 1} deleted` });
  }, []);

  const onChangeCellType = useCallback((newType: string) => {
    const focusIdx = notebookRef.current?.content?.cell_order?.findIndex(id => id === focusRef.current) ?? -1;
    const cell = notebookRef.current.content.cells[focusRef.current];
    const newCell = createCell(newType, cell.metadata);
    setNotebook(setCellContent(notebookRef.current, focusRef.current, newCell));
    sendNotification({ variant: 'success', message: `Cell #${focusIdx + 1} type changed to ${newType}` });
  }, []);

  const onChangeTimeout = useCallback((timeout: number) => {
    setNotebook(setCellMeta(notebookRef.current, focusRef.current, { timeout }));
  }, []);

  const onRunCell = useCallback(() => {
    runCells([focusRef.current]);
  }, []);

  const onRunAll = useCallback(() => {
    runCells(notebookRef.current.content.cell_order);
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
      <IconButton aria-label="run" size="large" onClick={onRunCell}>
        <PlayArrowIcon fontSize="inherit"/>
      </IconButton>
      <IconButton aria-label="runAll" size="large" onClick={onRunAll}>
        <FastForwardIcon fontSize="inherit"/>
      </IconButton>
      <Divider orientation="vertical" flexItem/>
      <FormControl variant="filled" sx={{ minWidth: 120 }}>
        <InputLabel>Cell Type</InputLabel>
        <Select
          displayEmpty
          sx={{ border: 'none' }}
          value={focusCellType}
          onChange={(e) => onChangeCellType(e.target.value)}
        >
          <MenuItem value={'code'}>Code</MenuItem>
          <MenuItem value={'markdown'}>Markdown</MenuItem>
          <MenuItem value={'widget_valuedistribution'}>Histogram Widget</MenuItem>
          <MenuItem value={'widget_triplematch'}>Triple Match Widget</MenuItem>
          <MenuItem value={'widget_classtree'}>Class Tree Widget</MenuItem>
        </Select>
      </FormControl>
      <Autocomplete
        sx={{ minWidth: 140 }}
        getOptionLabel={(option) => option.toString()}
        renderInput={(params) =>
          <TextField {...params} variant="filled" label="Timeout (s)" placeholder="Timeout (s)"/>}
        options={[ 5, 60, 60 * 3, 60 * 10 ]}
        disableClearable={true}
        value={focusCellTimeout / 1000}
        onChange={(event, newValue) => newValue && onChangeTimeout(newValue as number * 1000)}
      />
    </Box>
  ), [ focus, focusCellType, focusCellTimeout ]);
}
