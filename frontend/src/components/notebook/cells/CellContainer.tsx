import { LoadingButton } from "@mui/lab";
import { Box, Grid } from "@mui/material";
import { useCellContext } from "../../../providers/CellProvider";
import { CELL_TYPES } from "./CellTypes";
import { CodeCell } from "./types/CodeCell";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

export const CellContainer = (props: {}) => {
  const { cell, runCell, running } = useCellContext();

  const {
    Content, Output
  } = CELL_TYPES[cell.cell_type]

  return (cell &&
      <Box py={2} sx={{ display: 'flex' }}>
          <Box>
              <LoadingButton loading={running} variant="text" onClick={runCell}>
                  <PlayArrowIcon/>
              </LoadingButton>
          </Box>
          <Box sx={{ flexGrow: 1, pl: 1 }}>
              <Grid item>
                  <Grid container >
                      <Content/>
                  </Grid>
                {cell.outputs.length > 0 && (
                  <Output/>
                )}
              </Grid>
          </Box>
      </Box>
  );
}
