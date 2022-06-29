import { CardHeader, Input, Skeleton} from "@mui/material";
import { useCallback, useMemo } from "react";
import { useNotebookContext } from "../../providers/NotebookProvider";


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
  }, [notebookRef]);

  return useMemo(() => (
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
    />
  ), [notebook?.metadata?.name, isSaving, changed]);
}
