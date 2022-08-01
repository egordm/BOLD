import _ from "lodash";
import React from "react";
import Plot from 'react-plotly.js';


export const HistogramPlot = (props: {
  title?: string;
  x: (string | number)[];
  y: number[];
  z?: (string | number)[];
  normalized?: boolean;
  cumulative?: boolean;
  height?: number;
  layout?: Partial<Plotly.Layout>;
}) => {
  const { title, x, y, z, layout, cumulative = false, normalized = false, height = 400 } = props;

  let x_new = x;
  let y_new = y;
  let z_new = z;
  if (normalized) {
    if (z_new) {
      const z_sum = {};
      _.zip(y_new, z_new).forEach(([ y, z ]) => {
        z_sum[z] = (z_sum[z] || 0) + y;
      });
      y_new = _.zip(y_new, z_new).map(([ y, z ]) => y / z_sum[z]);
    } else {
      const y_sum = y.reduce((a, b) => a + b, 0);
      y_new = y.map(y_i => y_i / y_sum);
    }
  }

  if (cumulative && !z_new) {
    const allNumeric = x_new.every(x_i => !isNaN(Number(x_i)));
    if (allNumeric) {
      x_new = x_new.map(x_i => Number(x_i));
    }

    const idx = _.sortBy(x_new.map((v, i) => ({ v, i })), 'v');
    x_new = idx.map(({ v }) => v);
    y_new = idx.map(({ i }) => y_new[i]);

    let acc = 0;
    y_new = y_new.map(y_i => {
      acc += y_i;
      return acc;
    });
  }

  let data = z_new ? [
    ..._.uniq(x_new).map(x => ({
      x: _.zip(x_new, z_new).filter(([ x_i, _ ]) => x_i === x).map(([ _, z_i ]) => z_i),
      y: _.zip(x_new, y_new).filter(([ x_i, _ ]) => x_i === x).map(([ _, y_i ]) => y_i),
      stackgroup: 'one',
      name: `${x}`,
    }))
  ] : [
    {
      type: 'bar', x: x_new, y: y_new,
    },
  ]

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
