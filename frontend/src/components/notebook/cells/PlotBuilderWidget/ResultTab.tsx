import { Grid, Stack, Typography } from "@mui/material";
import _ from "lodash";
import React, { useMemo } from "react";
import { usePrefixes } from "../../../../providers/ReportProvider";
import { CellExecuteOutput, CellOutput, WidgetCellType } from "../../../../types/notebooks";
import { Prefixes } from "../../../../types/sparql";
import {
  extractSparqlResult,
  sparqlParseValue, sparqlPrettyPrint,
  SPARQLResultTransposed,
  sparqlTransposeResult
} from "../../../../utils/sparql";
import { cellOutputToYasgui } from "../../../../utils/yasgui";
import { BarPlot } from "../../../data/plots/BarPlot";
import { GroupedAreaPlot } from "../../../data/plots/GroupedAreaPlot";
import { GroupedBarPlot } from "../../../data/plots/GroupedBarPlot";
import { PiePlot } from "../../../data/plots/PiePlot";
import { Yasr } from "../../../data/Yasr";
import { Checkbox } from "../../../input/Checkbox";
import { SimpleSelect } from "../../../input/SimpleSelect";
import { OptionType } from "../../../input/VariableInput";
import { PlotBuilderData } from "./types";

export const ResultTab = ({
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
    const result = extractSparqlResult(outputs[0]);
    if (!result) return null;
    const df = sparqlTransposeResult(extractSparqlResult(outputs[0]));
    if (!df) return null;

    const x = snapshot.x?.dtype === 'categorical'
      ? parseSelectColumns(df, snapshot.x?.vars, prefixes)
      : df[snapshot.x?.vars[0].value].map(sparqlParseValue);
    const y = df[snapshot.y?.vars[0].value].map(sparqlParseValue);
    const z = snapshot.xy_only ? null : (
      snapshot.z?.dtype === 'categorical'
        ? parseSelectColumns(df, snapshot.z?.vars, prefixes)
        : df[snapshot.z?.vars[0].value].map(sparqlParseValue)
    );
    return { x, z, y };
  }, [ outputs ]);

  const output_mode = data.output_mode ?? 'plot';

  if (output_mode === 'plot' && plotData) {
    const { x, y, z } = plotData;

    if (x.length < 2) {
      return (
        <Stack direction="column">
          <Typography variant="h4">Not enough data to create a plot!</Typography>
          <Typography>Double check your filters and column types.</Typography>
        </Stack>
      )
    }

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
          <Stack direction={"column"} justifyContent={"stretch"}>
            {plotOptions}
          </Stack>
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
            labels={labels as any}
            values={values}
          />)
        );
      }
      case 'bar': {
        const labels = snapshot.xy_only ? x : _.zip(x, z).map(([ x, z ]) => `${x} - ${z}`);
        const values = y as number[];

        return plotControls(
          (<BarPlot
            labels={labels as any}
            values={values}
          />)
        );
      }
      case 'bar_grouped': {
        return plotControls(
          (<GroupedBarPlot
            labels={x as any[]}
            values={y as number[]}
            groups={z as any[]}
            mode={data?.group_mode as any ?? 'group'}
          />),
          (
            <SimpleSelect
              sx={{ flex: 1 }}
              label="Group Mode"
              options={GROUP_MODE}
              value={data?.group_mode ?? 'group'}
              onChange={(group_mode: string) => setData({ group_mode })}
            />
          )
        );
      }
      case 'area_grouped': {
        return plotControls(
          (<GroupedAreaPlot
            labels={x as any[]}
            values={y as number[]}
            groups={z as any[]}
            normalized={data?.normalize ?? false}
          />),
          (
            <Checkbox
              value={data?.normalize ?? false}
              label="Normalize"
              onChange={(event) => setData({ normalize: event.target.checked })}
            />
          )
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

export const PLOT_TYPES_XY = [
  { value: 'pie', label: 'Pie Plot' },
  { value: 'bar', label: 'Bar Plot' },
]

export const PLOT_TYPES_XYZ = [
  { value: 'pie', label: 'Pie Plot' },
  { value: 'bar', label: 'Bar Plot' },
  { value: 'bar_grouped', label: 'Grouped Bar Plot' },
  { value: 'area_grouped', label: 'Grouped Area Plot' },
]

export const GROUP_MODE = [
  { value: 'stack', label: 'Stacked' },
  { value: 'group', label: 'Grouped' },
]
