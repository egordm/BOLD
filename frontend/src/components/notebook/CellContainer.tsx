import { LoadingButton } from "@mui/lab";
import { Box, Button, Chip, CircularProgress, Divider, Grid, Stack, useTheme } from "@mui/material";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { makeStyles } from "@mui/styles";
import { useCallback, useMemo } from "react";
import { useCellFocusContext } from "../../providers/CellFocusProvider";
import { useCellContext } from "../../providers/CellProvider";
import { ClassBrowserWidget } from "./cells/ClassBrowserWidget";
import { ClassTreeWidget } from "./cells/ClassTreeWidget";
import { CodeWidget } from "./cells/CodeWidget";
import { PlotBuilderWidget } from "./cells/PlotBuilderWidget";
import { PropertiesWidget } from "./cells/PropertiesWidget";
import { QueryBuilderWidget } from "./cells/QueryBuilderWidget";
import { SubgraphWidget } from "./cells/SubgraphWidget";
import { ValueDistributionWidget } from "./cells/ValueDistributionWidget";
import {MarkdownWidget} from "./cells/MarkdownWidget";


const useStyles = makeStyles((theme) => ({
  collapseDivider: {
    "&::before, &::after": {
      top: 'initial!important',
    }
  }
}));

export const CELL_TYPES = {
  markdown: MarkdownWidget,
  code: CodeWidget,
  widget_valuedistribution: ValueDistributionWidget,
  widget_classtree: ClassTreeWidget,
  widget_propertiespreview: PropertiesWidget,
  widget_subgraph: SubgraphWidget,
  widget_classbrowser: ClassBrowserWidget,
  widget_plotbuilder: PlotBuilderWidget,
  widget_querybuilder: QueryBuilderWidget,
}

export const CellContainer = (props: {}) => {
  const theme = useTheme();
  const { focus } = useCellFocusContext();
  const { cell, cellIndex, cellRef, state, runCell, setCell } = useCellContext();

  const focused = focus === cell.metadata.id;
  const collapsed = cell.metadata.collapsed ?? false;
  const Cell = CELL_TYPES[cell.cell_type];

  const toggleCollapse = useCallback(() => {
    setCell({
      ...cellRef.current,
      metadata: {
        ...cellRef.current.metadata,
        collapsed: !cellRef.current.metadata.collapsed,
      }
    })
  }, []);

  const styles = useStyles();

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
      <Stack direction="column" alignContent="center">
        <Button size="small" variant="text" onClick={toggleCollapse}>[{cellIndex + 1}]</Button>
        {ActionButton}
      </Stack>
      <Stack spacing={2} sx={{ flex: 1 }}>
        {!collapsed && Cell && <Cell/>}
        {collapsed && (
          <Stack style={{ flex: 1 }} direction="column" justifyContent="center">
            <Divider className={styles.collapseDivider}>
              <Button variant="text" onClick={toggleCollapse}>EXPAND</Button>
            </Divider>
          </Stack>
        )}
      </Stack>
    </Box>
  )
}
