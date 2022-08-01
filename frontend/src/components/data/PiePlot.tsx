import React from "react";
import Plot from 'react-plotly.js';


export const PiePlot = (props: {
  title?: string;
  values: {
    label: string;
    value: number;
  }[];
  height?: number;
  layout?: Partial<Plotly.Layout>;
}) => {
  const { title, values, layout, height = 400 } = props;

  return (
    <Plot
      data={[
        {
          type: "pie",
          labels: values.map(({ label }) => label),
          values: values.map(({ value }) => value),
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
