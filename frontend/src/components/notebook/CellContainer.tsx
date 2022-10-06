import { LoadingButton } from "@mui/lab";
import { Box, CircularProgress, Grid, Stack, useTheme } from "@mui/material";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useMemo } from "react";
import { useCellFocusContext } from "../../providers/CellFocusProvider";
import { useCellContext } from "../../providers/CellProvider";
import { ClassBrowserWidget } from "./cells/ClassBrowserWidget";
import { ClassTreeWidget } from "./cells/ClassTreeWidget";
import { CodeCell } from "./cells/CodeCell";
import { PlotBuilderWidget } from "./cells/PlotBuilderWidget";
import { PropertiesPreviewWidget } from "./cells/PropertiesPreviewWidget";
import { QueryBuilderWidget } from "./cells/QueryBuilderWidget";
import { SubgraphWidget } from "./cells/SubgraphWidget";
import { TripleMatchWidget } from "./cells/TripleMatchWidget";
import { ValueDistributionWidget } from "./cells/ValueDistributionWidget";

export const CELL_TYPES = {
  code: CodeCell,
  widget_valuedistribution: ValueDistributionWidget,
  widget_triplematch: TripleMatchWidget,
  widget_classtree: ClassTreeWidget,
  widget_propertiespreview: PropertiesPreviewWidget,
  widget_subgraph: SubgraphWidget,
  widget_classbrowser: ClassBrowserWidget,
  widget_plotbuilder: PlotBuilderWidget,
  widget_querybuilder: QueryBuilderWidget,
}

export const CellContainer = (props: {}) => {
  const theme = useTheme();
  const { focus } = useCellFocusContext();
  const { cell, state, runCell } = useCellContext();

  const focused = focus === cell.metadata.id;
  const Cell = CELL_TYPES[cell.cell_type];

  // console.log(state)

  const ActionButton = useMemo(() => {
    const running = state?.status === "RUNNING" || state?.status === "QUEUED";
    const color = running ? 'primary'
      : state?.status === "FINISHED" ? 'success'
        : state?.status === "ERROR" ? 'error'
          : 'primary';

    return (
      <LoadingButton
        loading={running}
        variant="text"
        onClick={runCell}
        color={color}
        loadingIndicator={<CircularProgress color="primary" size={16}/>}
      >
        <PlayArrowIcon/>
      </LoadingButton>
    )
  }, [ state ]);

  return (
    <Box py={2} sx={{
      display: 'flex',
      borderColor: focused ? theme.palette.grey["300"] : 'transparent',
      borderStyle: 'solid',
      borderRadius: '8px',
      position: 'relative',
    }}>
      <Box>
        {ActionButton}
      </Box>
      <Stack spacing={2} sx={{ flex: 1 }}>
        {Cell && <Cell/>}
      </Stack>
    </Box>
  )
}
