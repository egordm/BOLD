import { Typography } from "@mui/material";
import { useCellContext } from "../../../providers/CellProvider";


export const ValueDistributionWidget = (props: {}) => {
  const { cell, outputs, setCell } = useCellContext();

  return (
    <>
      <Typography>Value Distribution</Typography>
    </>
  )
}
