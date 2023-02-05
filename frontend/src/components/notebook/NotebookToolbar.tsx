import AbcIcon from "@mui/icons-material/Abc";
import {
  Autocomplete,
  Box, Divider,
  FormControl, InputLabel,
  MenuItem,
  Select, TextField
} from "@mui/material";
import { Add } from '@mui/icons-material';
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { NamespaceEditForm } from "../../containers/datasets/NamespaceEditForm";
import useNotification from "../../hooks/useNotification";
import { useCellFocusContext } from "../../providers/CellFocusProvider";
import { useClipboardContext } from "../../providers/ClipboardProvider";
import { useNotebookContext } from "../../providers/NotebookProvider";
import { useReportContext } from "../../providers/ReportProvider";
import { useRunQueueContext } from "../../providers/RunQueueProvider";
import { useUndoHistoryContext } from "../../providers/UndoHistoryProvider";
import { addCell, createCell, removeCell, setCellContent, setCellMeta, setCellOutputs } from "../../types/notebooks";
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FastForwardIcon from '@mui/icons-material/FastForward';
import { IconButton } from "../input/IconButton";
import { ModalContainer } from "../layout/ModalContainer";
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';

export const NotebookToolbar = (props: {}) => {
  const { report, refetch } = useReportContext();
  const { focus, focusRef, setFocus } = useCellFocusContext();
  const { notebook, notebookRef } = useNotebookContext();
  const { setNotebook } = useUndoHistoryContext();
  const { runCells } = useRunQueueContext();
  const { undo, redo } = useUndoHistoryContext();
  const { copy, paste } = useClipboardContext();

  const { sendNotification } = useNotification();

  const focusCell = focus ? notebook.content.cells[focus] : null;
  const focusCellType = focusCell?.cell_type ?? 'code';
  const focusCellTimeout = focusCell?.metadata?.timeout ?? 5000;

  const [ editNamespaces, setEditNamespaces ] = useState<boolean>(false);

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
    const newCell = createCell(newType, cell.metadata, cell);

    // Change cell type and clear outputs
    setNotebook(
      setCellOutputs(
        setCellContent(notebookRef.current, focusRef.current, newCell),
        focusRef.current,
        []
      )
    );
    sendNotification({ variant: 'success', message: `Cell #${focusIdx + 1} type changed to ${newType}` });
  }, []);

  const onChangeTimeout = useCallback((timeout: number) => {
    setNotebook(setCellMeta(notebookRef.current, focusRef.current, { timeout }));
  }, []);

  const onRunCell = useCallback(() => {
    runCells([ focusRef.current ]);
  }, []);

  const onRunAll = useCallback(() => {
    runCells(notebookRef.current.content.cell_order);
  }, []);

  const NamespaceModal = useMemo(() => (
    <ModalContainer
      width={720}
      title={'Edit Namespaces'}
      open={editNamespaces}
      onClose={() => setEditNamespaces(false)}>
      <NamespaceEditForm dataset={report?.dataset} onClose={(updated) => {
        setEditNamespaces(false)
        if (updated) {
          refetch();
        }
      }}/>
    </ModalContainer>
  ), [ editNamespaces, report?.dataset ]);

  const Actions = useMemo(() => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        border: (theme) => `1px solid ${theme.palette.divider}`,
        borderLeftWidth: '0px',
        borderRightWidth: '0px',
        borderRadius: 1,
        bgcolor: 'background.paper',
        color: 'text.secondary',
        pl: 2,
      }}
    >
      <IconButton size="large" onClick={onAddCell} label="Add cell" icon={<Add fontSize="inherit"/>}/>
      <IconButton size="large" onClick={onDeleteCell} label="Delete cell" icon={<DeleteIcon fontSize="inherit"/>}
                  disabled={!focus}/>
      <Divider orientation="vertical" flexItem/>
      {/*<IconButton size="large" label="Cut cell" icon={<ContentCutIcon fontSize="inherit"/>}/>*/}
      <IconButton size="large" onClick={copy} label="Copy cell" icon={<ContentCopyIcon fontSize="inherit"/>}/>
      <IconButton size="large" onClick={paste} label="Paste cell" icon={<ContentPasteIcon fontSize="inherit"/>}/>
      <Divider orientation="vertical" flexItem/>
      <IconButton size="large" onClick={onRunCell} label="Run cell" icon={<PlayArrowIcon fontSize="inherit"/>}
                  disabled={!focus}/>
      <IconButton size="large" onClick={onRunAll} label="Run all" icon={<FastForwardIcon fontSize="inherit"/>}/>
      <IconButton size="large" label="Edit Namespaces" icon={<AbcIcon/>} onClick={() => setEditNamespaces(true)}/>
      <Divider orientation="vertical" flexItem/>
      <FormControl variant="filled" sx={{ minWidth: 120 }}>
        <InputLabel>Cell Type</InputLabel>
        <Select
          disabled={!focus}
          displayEmpty
          sx={{ border: 'none' }}
          value={focusCellType}
          onChange={(e) => onChangeCellType(e.target.value)}
        >
          <MenuItem value={'code'}>Code</MenuItem>
          <MenuItem value={'markdown'}>Markdown</MenuItem>
          <MenuItem value={'widget_classbrowser'}>Class Browser</MenuItem>
          <MenuItem value={'widget_valuedistribution'}>Histogram Builder</MenuItem>
          <MenuItem value={'widget_plotbuilder'}>Plot Builder</MenuItem>
          <MenuItem value={'widget_querybuilder'}>Query Builder</MenuItem>
          <MenuItem value={'widget_propertiespreview'}>Entity Properties</MenuItem>
          <MenuItem value={'widget_subgraph'}>Subgraph View</MenuItem>
          <MenuItem value={'widget_classtree'}>Class Statistics</MenuItem>
        </Select>
      </FormControl>
      <Autocomplete
        disabled={!focus}
        sx={{ minWidth: 140 }}
        getOptionLabel={(option) => option.toString()}
        renderInput={(params) =>
          <TextField {...params} variant="filled" label="Timeout (s)" placeholder="Timeout (s)"/>}
        options={[ 5, 60, 60 * 3, 60 * 10 ]}
        disableClearable={true}
        value={focusCellTimeout / 1000}
        onChange={(event, newValue) => newValue && onChangeTimeout(newValue as number * 1000)}
      />
      <Box sx={{ flex: 1 }}/>
      <IconButton size="large" label="Undo" icon={<UndoIcon/>} onClick={undo}/>
      <IconButton size="large" label="Redo" icon={<RedoIcon/>} onClick={redo}/>
    </Box>
  ), [ focus, focusCellType, focusCellTimeout ]);

  return (<>
    {Actions}
    {NamespaceModal}
  </>)
}
