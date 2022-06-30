import dynamic from "next/dynamic";
import React from "react";


const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });


export const HistogramPlot = (props: {
  title?: string;
  x: string[];
  y: number[];
  height?: number;
  layout?: Partial<Plotly.Layout>;
}) => {
  const { title, x, y, layout, height= 400 } = props;

  return (
    <Plot
      data={[
        { type: 'bar', x, y },
      ]}
      style={{width: "100%"}}
      layout={{
        autosize: true,
        height,
        title,
        ...layout,
      }}
    />
  )
}
