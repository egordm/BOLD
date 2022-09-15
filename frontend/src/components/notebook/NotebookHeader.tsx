import { Button, CardHeader, IconButton, Input, Skeleton, Tooltip } from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import { useNotebookContext } from "../../providers/NotebookProvider";
import ShareIcon from '@mui/icons-material/Share';
import { ShareOptionsModal } from "./ShareOptionsModal";


export const NotebookHeader = (props: {}) => {
  const {
    notebook,
    notebookRef,
    setNotebook,
    isSaving,
    changed,
  } = useNotebookContext();

  const setTitle = useCallback((name: string) => {
    setNotebook({
      ...notebookRef.current,
      metadata: {
        ...notebookRef.current?.metadata,
        name,
      }
    })
  }, [ notebookRef ]);

  const [ openShareOptions, setOpenShareOptions ] = useState(false);

  const header = useMemo(() => (
    <CardHeader
      title={
        notebook === null
          ? <Skeleton variant="text"/>
          : <Input
            fullWidth
            value={notebook?.metadata?.name}
            onChange={(e) => setTitle(e.target.value)}
          />
      }
      subheader={
        notebook === null
          ? <Skeleton variant="text"/>
          : isSaving
            ? 'Saving...'
            : !changed
              ? 'Draft saved'
              : 'Changed'
      }
      action={
        <Button
          sx={{ ml: 2 }} variant="contained" startIcon={<ShareIcon/>}
          onClick={() => setOpenShareOptions(true)}
        >Share</Button>
      }
    />
  ), [ notebook?.metadata?.name, isSaving, changed ]);

  return (
    <>
      {header}
      <ShareOptionsModal open={openShareOptions} onClose={() => setOpenShareOptions(false)}/>
    </>
  )
}
