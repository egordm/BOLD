import React from "react";
import Plot from 'react-plotly.js';


export const BarPlot = ({
  title,
  labels,
  values,
  layout,
  height = 400
}: {
  title?: string;
  labels: string[];
  values: number[];
  height?: number;
  layout?: Partial<Plotly.Layout>;
}) => {
  return (
    <Plot
      data={[
        {
          type: "bar",
          x: labels,
          y: values,
        }
      ]}
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
