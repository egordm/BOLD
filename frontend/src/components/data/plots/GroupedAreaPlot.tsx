import React from "react";
import Plot from 'react-plotly.js';
import { arrayBinnedNormalize, groupArraysBy } from "../../../utils/math";


export const GroupedAreaPlot = ({
  title,
  labels,
  values,
  groups,
  layout,
  height = 400,
  normalized = false,
}: {
  title?: string;
  labels: string[];
  values: number[];
  groups: string[];
  height?: number;
  layout?: Partial<Plotly.Layout>;
  normalized?: boolean;
}) => {
  const valuesProcessed = normalized ? arrayBinnedNormalize(labels, values) : values;
  const labelsGrouped = groupArraysBy(groups, labels);
  const valuesGrouped = groupArraysBy(groups, valuesProcessed);

  const data = Object.keys(labelsGrouped).map((group, i) => ({
    x: labelsGrouped[group],
    y: valuesGrouped[group],
    stackgroup: 'one',
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
        ...layout,
      }}
    />
  )
}
