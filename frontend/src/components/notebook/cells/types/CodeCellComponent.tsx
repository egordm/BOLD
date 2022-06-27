import { Grid } from "@mui/material";
import { useCellContext } from "../../../../providers/CellProvider";
import { CodeCell } from "../../../../types/notebooks";
import { Yasqe } from "../../../input/Yasqe";


export const CodeCellComponent = (props: {}) => {
  const { cell, setCell } = useCellContext();
  const { source } = cell as CodeCell;

  const onChange = (value, viewUpdate) => {
    setCell({
      ...cell,
      source: value,
    })
  }


  return (
    <Grid item xs={12}>
      <Yasqe
        value={source || ''}
        onChange={onChange}
      />
    </Grid>
  );
}
