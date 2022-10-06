import React from "react";
import Plot from 'react-plotly.js';
import { groupArraysBy } from "../../../utils/math";


export const GroupedBarPlot = ({
  title,
  labels,
  values,
  groups,
  layout,
  height = 400,
  mode = 'group',
}: {
  title?: string;
  labels: string[];
  values: number[];
  groups: string[];
  height?: number;
  layout?: Partial<Plotly.Layout>;
  mode?: 'stack' | 'group';
}) => {
  const labelsGrouped = groupArraysBy(groups, labels);
  const valuesGrouped = groupArraysBy(groups, values);

  const data = Object.keys(labelsGrouped).map((group, i) => ({
    type: "bar",
    x: labelsGrouped[group],
    y: valuesGrouped[group],
    name: group,
  }));

  return (
    <Plot
      data={data as any}
      style={{ width: "100%" }}
      layout={{
        autosize: true,
        height,
        title,
        barmode: mode,
        ...layout,
      }}
    />
  )
}
