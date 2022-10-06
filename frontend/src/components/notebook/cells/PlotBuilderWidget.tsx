import {
  CardHeader, Grid,
  IconButton, Stack
} from "@mui/material";
import { variable } from "@rdfjs/data-model";
import { SELECT } from "@tpluscode/sparql-builder";
import _ from "lodash";
import React, { useEffect, useMemo } from "react";
import { RuleGroupType } from "react-querybuilder";
import { useCellWidgetData } from "../../../hooks/useCellWidgetData";
import { useCellContext } from "../../../providers/CellProvider";
import { usePrefixes } from "../../../providers/ReportProvider";
import { Cell, CellExecuteOutput, CellOutput, WidgetCellType } from "../../../types/notebooks";
import { Prefixes } from "../../../types/sparql";
import {
  alias,
  brackets, extractSparqlResult,
  PREFIXES,
  sparqlLabelBound,
  sparqlLabelsBound, sparqlParseValue, sparqlPrettyPrint, SPARQLResultTransposed,
  sparqlTransposeResult
} from "../../../utils/sparql";
import { cellOutputToYasgui } from "../../../utils/yasgui";
import { BarPlot } from "../../data/plots/BarPlot";
import { PiePlot } from "../../data/plots/PiePlot";
import { SourceViewModal } from "../../data/SourceViewModal";
import CodeIcon from '@mui/icons-material/Code';
import { Yasr } from "../../data/Yasr";
import { Checkbox } from "../../input/Checkbox";
import { GutterInput, GutterSelect } from "../../input/GutterInput";
import { NumberedSlider } from "../../input/NumberedSlider";
import QueryBuilder from "../../input/QueryBuilder";
import { aggregateToSparql, queryToSparql } from "../../input/QueryBuilder/sparql";
import { collectVarsFromGroup } from "../../input/QueryBuilder/utils";
import { SimpleSelect } from "../../input/SimpleSelect";
import { OptionType, VariableInput } from "../../input/VariableInput";
import { CellOutputTabs } from "../outputs/CellOutputTabs";

const MAX_GROUPS_LIMIT = 1000;


interface PlotBuilderData {
  tree: RuleGroupType,
  x_vars: OptionType[],
  y_vars: OptionType[],
  y_agg: string,
  z_vars?: OptionType[],
  max_groups_x?: number;
  min_group_x_size?: number;
  max_groups_z?: number;
  min_group_z_size?: number;
  xy_only: boolean;
  output_mode?: string;
  plot_type?: string;
}

const OUTPUT_TABS = [
  { value: 'plot', label: 'Plot' },
  { value: 'table', label: 'Table' },
]

const buildQuery = (data: PlotBuilderData) => {
  const x_vars = (data.x_vars ?? []).map(v => variable(v.value));
  const y_vars = (data.y_vars ?? []).map(v => variable(v.value));
  const z_vars = (data.z_vars ?? []).map(v => variable(v.value));

  if (!x_vars.length || !y_vars.length || (!data.xy_only && !z_vars.length)) {
    // return {};
    throw new Error('No variables selected');
  }

  const aggregatedVars = y_vars.map(v => alias(aggregateToSparql(null, v, data.y_agg), v));
  const orderVars = y_vars.map(v => brackets(aggregateToSparql(null, v, data.y_agg)));
  const { bounds: labelBounds, vars: labelVars } = sparqlLabelsBound([ ...x_vars, ...z_vars ]);
  const aggregatedLabelVars = labelVars.map(v => alias(aggregateToSparql(null, v, "SAMPLE"), v));
  const selectVars = [ ...x_vars, ...aggregatedVars, ...z_vars, ...aggregatedLabelVars ];
  const groupVars = [ ...x_vars, ...z_vars ];

  const body = queryToSparql(data.tree);

  let primaryQuery = SELECT`${selectVars}`
    .WHERE`
      ${body}
      ${labelBounds}
    `
    .LIMIT(data.max_groups_x ?? 20);

  const groupFirst = groupVars.shift();
  primaryQuery = groupVars.reduce(
    (query, varName) => query.THEN.BY(varName),
    primaryQuery.GROUP().BY(groupFirst)
  );

  const orderFirst = orderVars.shift();
  primaryQuery = orderVars.reduce(
    (query, varName) => query.THEN.BY(varName as any),
    primaryQuery.ORDER().BY(orderFirst as any)
  );

  return {
    primaryQuery: primaryQuery.build(),
  };
}


export const PlotBuilderWidget = (props: {}) => {
  const { cell } = useCellContext();
  const { data, source } = cell as WidgetCellType<PlotBuilderData>;
  const [ showSource, setShowSource ] = React.useState(false);
  const { setData } = useCellWidgetData(buildQuery);

  useEffect(() => {
    setData({
      xy_only: true,
      y_agg: 'COUNT',
      plot_type: 'pie',
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
          <GutterInput
            sx={{ flex: 1 }}
            gutter={<span>GROUP BY</span>}
          >
            <VariableInput
              options={variables as any}
              label="X Variables"
              allowAny={false}
              selectOnly={true}
              multiple={true}
              value={data.x_vars as any}
              onChange={(x_vars: OptionType[]) => setData({ x_vars })}
            />
          </GutterInput>
        </Grid>
        <Grid item xs={xy_only ? 6 : 4}>
          <GutterInput
            sx={{ flex: 1 }}
            padGutter={false}
            gutter={
              <GutterSelect
                options={AGGREGATE_FUNCTIONS}
                value={data.y_agg ?? 'COUNT'}
                onChange={(y_agg) => setData({ y_agg })}
              />
            }
          >
            <VariableInput
              options={variables as any}
              label="Y Variable"
              allowAny={false}
              selectOnly={true}
              multiple={false}
              value={data.y_vars?.length > 0 ? data.y_vars[0] as any : null}
              onChange={(y_var: OptionType) => setData({ y_vars: [ y_var ] })}
              defaultValue={[]}
            />
          </GutterInput>
        </Grid>
        {!xy_only && (
          <Grid item xs={4}>
            <GutterInput
              sx={{ flex: 1 }}
              gutter={<span>GROUP BY</span>}
            >
              <VariableInput
                options={variables as any}
                label="Z Variables"
                allowAny={false}
                selectOnly={true}
                multiple={true}
                value={data.z_vars as any}
                onChange={(z_vars: OptionType[]) => setData({ z_vars })}
                defaultValue={[]}
              />
            </GutterInput>
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
                min={1} max={MAX_GROUPS_LIMIT} step={Math.ceil(MAX_GROUPS_LIMIT / 20)}
              />
              {!xy_only && (
                <NumberedSlider
                  label={'Limit number of Z groups'}
                  value={data?.max_groups_z ?? 20}
                  valueLabelFormat={(value) => value !== MAX_GROUPS_LIMIT ? value.toString() : 'Unlimited'}
                  onChange={(event, max_groups: number) => setData({ max_groups_z: max_groups })}
                  min={1} max={MAX_GROUPS_LIMIT} step={Math.ceil(MAX_GROUPS_LIMIT / 20)}
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

  return (
    <>
      {Content}
      <CellOutputTabs
        mode={data.output_mode}
        options={OUTPUT_TABS}
        renderResult={ResultTab}
        onChange={(output_mode) => setData({ output_mode })}
        extraData={{ data, setData }}
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

const ResultTab = ({
  mode, cell, outputs, data, setData
}: {
  mode: string,
  cell: WidgetCellType<PlotBuilderData>,
  outputs: CellOutput[] | null,
  data: PlotBuilderData,
  setData: (data: Partial<PlotBuilderData>) => void,
}) => {
  const prefixes = usePrefixes();

  const snapshot: PlotBuilderData = (outputs[0] as CellExecuteOutput).snapshot;

  const plotData = useMemo(() => {
    const df = sparqlTransposeResult(extractSparqlResult(outputs[0]));
    if (!df) {
      return null;
    }

    const x = parseSelectColumns(df, snapshot.x_vars, prefixes);
    const y = df[snapshot.y_vars[0].value].map(sparqlParseValue);
    const z = snapshot.xy_only ? null : parseSelectColumns(df, snapshot.z_vars, prefixes);
    return { x, z, y };
  }, [ outputs ]);

  const output_mode = data.output_mode ?? 'plot';

  if (output_mode === 'plot' && plotData) {
    const { x, y, z } = plotData;

    const plotControls = (plot: React.ReactNode, plotOptions?: React.ReactNode) => (
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <SimpleSelect
            formControlProps={{ fullWidth: true }}
            label="Plot type"
            options={snapshot.xy_only ? PLOT_TYPES_XY : PLOT_TYPES_XYZ}
            value={data.plot_type}
            onChange={(plot_type: string) => setData({ plot_type })}
          />
        </Grid>
        <Grid item xs={8}>
          {plotOptions}
        </Grid>
        <Grid item xs={12}>
          {plot}
        </Grid>
      </Grid>
    )

    switch (data.plot_type) {
      case 'pie': {
        const labels = snapshot.xy_only ? x : _.zip(x, z).map(([ x, z ]) => `${x} - ${z}`);
        const values = y as number[];

        return plotControls(
          (<PiePlot
            labels={labels}
            values={values}
          />)
        );
      }
      case 'bar': {
        const labels = snapshot.xy_only ? x : _.zip(x, z).map(([ x, z ]) => `${x} - ${z}`);
        const values = y as number[];

        return plotControls(
          (<BarPlot
            labels={labels}
            values={values}
          />)
        );
      }
      default: {
        return null;
      }
    }
  } else {
    return (<Yasr
      result={cellOutputToYasgui(outputs[0])}
      prefixes={prefixes}
    />)
  }
}


const AGGREGATE_FUNCTIONS = [
  { value: 'COUNT', label: 'COUNT' },
  { value: 'SUM', label: 'SUM' },
  { value: 'AVG', label: 'AVG' },
  { value: 'MIN', label: 'MIN' },
  { value: 'MAX', label: 'MAX' },
]

const PLOT_TYPES_XY = [
  { value: 'pie', label: 'Pie' },
  { value: 'bar', label: 'Bar' },
]

const PLOT_TYPES_XYZ = [
  { value: 'pie', label: 'Pie' },
  { value: 'bar', label: 'Bar' },
]

const parseSelectColumns = (
  df: SPARQLResultTransposed,
  columns: OptionType[],
  prefixes: Prefixes,
  extractLabel = true,
) => {
  const xs = [];
  for (const xVar of columns) {
    xs.push(_.zip(df[xVar.value], df[`${xVar.value}Label`]).map(([ v, label ]) => {
      return sparqlPrettyPrint(sparqlParseValue(v), sparqlParseValue(label), prefixes, extractLabel)
    }))
  }
  return _.zip(...xs).map((v) => v.join('-'));
}
