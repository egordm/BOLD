import { CardHeader, Input, Skeleton} from "@mui/material";
import { useNotebookContext } from "../../providers/NotebookProvider";


export const NotebookHeader = (props: {}) => {
  const {
    notebook,
    setNotebook,
    isSaving,
    changed,
  } = useNotebookContext();

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
            : !changed
              ? 'Draft saved'
              : 'Changed'
      }
    />
  );
}
