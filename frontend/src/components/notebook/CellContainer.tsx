import { LoadingButton } from "@mui/lab";
import { Box, Grid, Stack, useTheme } from "@mui/material";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useCellFocusContext } from "../../providers/CellFocusProvider";
import { useCellContext } from "../../providers/CellProvider";
import { CodeCell } from "./cells/CodeCell";

export const CELL_TYPES = {
  code: CodeCell
}

export const CellContainer = (props: {}) => {
  const theme = useTheme();
  const { focus } = useCellFocusContext();
  const { cell, state, runCell } = useCellContext();

  const running = state?.status === "RUNNING" || state?.status === "QUEUED";
  const focused = focus === cell.metadata.id;

  const Cell = CELL_TYPES[cell.cell_type];

  return (
    <Box py={2} sx={{
      display: 'flex',
      borderColor: focused ? theme.palette.grey["300"] : 'transparent',
      borderStyle: 'solid',
      borderRadius: '8px',
    }}>
      <Box>
        <LoadingButton loading={running} variant="text" onClick={runCell}>
          <PlayArrowIcon/>
        </LoadingButton>
      </Box>
      <Stack spacing={2} sx={{flex: 1}}>
        <Cell/>
      </Stack>
    </Box>
  )
}
