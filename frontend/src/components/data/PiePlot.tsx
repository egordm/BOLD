import dynamic from "next/dynamic";
import React from "react";


const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });


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
