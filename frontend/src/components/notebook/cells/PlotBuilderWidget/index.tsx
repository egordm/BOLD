import {
  CardHeader, Grid,
  IconButton, Stack
} from "@mui/material";
import React, { useEffect, useMemo } from "react";
import { useCellWidgetData } from "../../../../hooks/useCellWidgetData";
import { useCellContext } from "../../../../providers/CellProvider";
import { WidgetCellType } from "../../../../types/notebooks";
import { SourceViewModal } from "../../../data/SourceViewModal";
import CodeIcon from '@mui/icons-material/Code';
import { Checkbox } from "../../../input/Checkbox";
import { NumberedSlider } from "../../../input/NumberedSlider";
import QueryBuilder from "../../../input/QueryBuilder";
import { collectVarsFromGroup } from "../../../input/QueryBuilder/utils";
import { CellOutputTabs } from "../../outputs/CellOutputTabs";
import { buildQuery } from "./query";
import { ResultTab } from "./ResultTab";
import { PlotBuilderData } from "./types";
import { VariableSelector } from "./VariableSelector";

const MAX_GROUPS_LIMIT = 1000;

const OUTPUT_TABS = [
  { value: 'plot', label: 'Plot' },
  { value: 'table', label: 'Table' },
]

const DEFAULT_X = { vars: [{ value: 'main', label: 'main' }], aggregate: 'COUNT', dtype: 'categorical' };
const DEFAULT_Y = { vars: [{ value: 'main', label: 'main' }], aggregate: 'COUNT', dtype: 'numeric' };
const DEFAULT_Z = { vars: [{ value: 'main', label: 'main' }], aggregate: 'COUNT', dtype: 'categorical' };


export const PlotBuilderWidget = (props: {}) => {
  const { cell } = useCellContext();
  const { data, source } = cell as WidgetCellType<PlotBuilderData>;
  const [ showSource, setShowSource ] = React.useState(false);
  const { setData } = useCellWidgetData(buildQuery);

  useEffect(() => {
    setData({
      xy_only: true,
      output_config: {
        plot_type: 'pie',
      },
      x: DEFAULT_X,
      y: DEFAULT_Y,
      z: DEFAULT_Z,
      ...data,
    })
  }, []);

  const variables = useMemo(() => collectVarsFromGroup(data.tree), [ data.tree ]);
  const { xy_only } = data;

  const queryBuilder = useMemo(() => (
    <QueryBuilder
      value={data?.tree}
      setValue={(tree) => setData({ tree })}/>
  ), [ data?.tree ]);

  // const

  const Content = useMemo(() => (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <CardHeader
            sx={{ p: 0 }}
            title="Plot Builder Widget"
            subheader="Query and plot SPARQL data in a visual way"
            action={
              <IconButton aria-label="View source" onClick={() => setShowSource(true)}>
                <CodeIcon/>
              </IconButton>
            }
          />
        </Grid>
        <Grid item xs={xy_only ? 6 : 4}>
          <VariableSelector
            label="X Variable"
            gutterText="Group by"
            value={data.x}
            allowMultiple={false}
            setValue={(x) => setData({ x })}
            variables={variables}
            showDTypes={true}
            defaultValue={DEFAULT_X}
            />
        </Grid>
        <Grid item xs={xy_only ? 6 : 4}>
          <VariableSelector
            label="Y Variable"
            value={data.y}
            allowMultiple={false}
            setValue={(y) => setData({ y })}
            variables={variables}
            showAggs={true}
            defaultValue={DEFAULT_Y}
          />
        </Grid>
        {!xy_only && (
          <Grid item xs={4}>
            <VariableSelector
              label="Z Variable"
              gutterText="Group by"
              value={data.z}
              allowMultiple={false}
              setValue={(z) => setData({ z })}
              variables={variables}
              showDTypes={true}
              defaultValue={DEFAULT_Z}
            />
          </Grid>
        )}
        <Grid item xs={12}>
          <Stack direction="row" spacing={2}>
            <Stack direction="column">
              <Checkbox
                value={!(data.xy_only ?? true)}
                onChange={(e) => setData({ xy_only: !e.target.checked })}
                label="XYZ Plot"/>
            </Stack>
            <Stack direction="column" sx={{ flex: 1 }}>
              <NumberedSlider
                label={'Limit number of X groups'}
                value={data?.max_groups_x ?? 20}
                valueLabelFormat={(value) => value !== MAX_GROUPS_LIMIT ? value.toString() : 'Unlimited'}
                onChange={(event, max_groups: number) => setData({ max_groups_x: max_groups })}
                min={1} max={300} step={10}
              />
              {!xy_only && (
                <NumberedSlider
                  label={'Limit number of Z groups'}
                  value={data?.max_groups_z ?? 20}
                  valueLabelFormat={(value) => value !== MAX_GROUPS_LIMIT ? value.toString() : 'Unlimited'}
                  onChange={(event, max_groups: number) => setData({ max_groups_z: max_groups })}
                  min={1} max={300} step={10}
                />
              )}
            </Stack>
          </Stack>

        </Grid>
        <Grid item xs={12}>
          {queryBuilder}
        </Grid>
      </Grid>
    </>
  ), [ data ]);

  const outputExtra = useMemo(() => ({
    data: data?.output_config ?? {},
    setData: (output_config) => setData({
      output_config: { ...(data?.output_config ?? {}),  ...output_config }
    })
  }), [ data?.output_config ]);

  return (
    <>
      {Content}
      <CellOutputTabs
        mode={data.output_mode}
        options={OUTPUT_TABS}
        renderResult={ResultTab}
        onChange={(output_mode) => setData({ output_mode })}
        extraData={outputExtra}
      />
      <SourceViewModal
        source={{
          'Primary Query': source[0],
        }}
        open={showSource}
        onClose={() => setShowSource(false)}
      />
    </>
  )
}
