import { CardHeader, Container, IconButton, Input, Skeleton, Typography } from "@mui/material";
import _ from "lodash";
import { useCallback } from "react";
import { useLocalNotebookContext } from "../../providers/LocalNotebookProvider";
import { useNotebookContext } from "../../providers/NotebookProvider";
import { useRemoteNotebookContext } from "../../providers/RemoteNotebookProvider";


export const NotebookHeader = (props: {}) => {
  const {
    localNotebook,
    setLocalNotebook,
    isSaving,
    changed,
  } = useNotebookContext();

  const setTitle = (name: string) => {
    setLocalNotebook({
      ...localNotebook,
      metadata: {
        ...localNotebook?.metadata,
        name,
      }
    })
  };

  return (
    <CardHeader
      title={
        localNotebook === null
          ? <Skeleton variant="text"/>
          : <Input
            fullWidth
            value={localNotebook?.metadata?.name}
            onChange={(e) => setTitle(e.target.value)}
          />
      }
      subheader={
        localNotebook === null
          ? <Skeleton variant="text"/>
          : isSaving
            ? 'Saving...'
            : !changed
              ? 'Draft saved'
              : 'Changed'
      }
    />
  );
}
