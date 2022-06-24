import { CardHeader, Container, IconButton, Input, Skeleton, Typography } from "@mui/material";
import _ from "lodash";
import { useCallback } from "react";
import { useLocalNotebookContext } from "../../providers/LocalNotebookProvider";
import { useRemoteNotebookContext } from "../../providers/RemoteNotebookProvider";


export const NotebookHeader = (props: {}) => {
  const {
    state: { isSaving }
  } = useRemoteNotebookContext();

  const {
    notebook, setNotebook,
    isUpToDate,
  } = useLocalNotebookContext();

  const setTitle = (name: string) => {
    setNotebook({
      ...notebook,
      metadata: {
        ...notebook?.metadata,
        name,
      }
    })
  };

  return (
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
            : isUpToDate
              ? 'Draft saved'
              : 'Changed'
      }
    />
  );
}
