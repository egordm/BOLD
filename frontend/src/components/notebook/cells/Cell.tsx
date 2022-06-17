import { Grid} from "@mui/material";
import { useCellContext } from "./CellProvider";
import { CodeCell } from "./types/CodeCell";

export const Cell = (props: {}) => {
  const { cell, runCell } = useCellContext();

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.shiftKey && event.key === 'Enter') {
      event.preventDefault();
      runCell();
    }
  }

  return (cell &&
      <Grid container py={2} onKeyDown={onKeyDown}>
          <CodeCell/>
      </Grid>
  );
}
