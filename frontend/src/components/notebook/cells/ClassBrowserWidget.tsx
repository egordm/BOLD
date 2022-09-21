import {
  CardHeader, Container, FormControl, FormGroup,
  Grid,
  IconButton, FormLabel, Typography, Link
} from "@mui/material";
import { namedNode } from "@rdfjs/data-model";
import { SELECT, sparql } from "@tpluscode/sparql-builder";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import Plot from "react-plotly.js";
import { useCellWidgetData } from "../../../hooks/useCellWidgetData";
import { useCellContext } from "../../../providers/CellProvider";
import { usePrefixes } from "../../../providers/ReportProvider";
import { Cell, CellOutput, WidgetCellType } from "../../../types/notebooks";
import { SparQLResult } from "../../../types/sparql";
import { extractIriLabel } from "../../../utils/formatting";
import { extractSparqlResult, PREFIXES, querySparqlLabel } from "../../../utils/sparql";
import { cellOutputToYasgui } from "../../../utils/yasgui";
import { SourceViewModal } from "../../data/SourceViewModal";
import { Yasr } from "../../data/Yasr";
import { NumberedSlider } from "../../input/NumberedSlider";
import CodeIcon from '@mui/icons-material/Code';
import { CellOutputTabs } from "../outputs/CellOutputTabs";
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Breadcrumbs from '@mui/material/Breadcrumbs';

interface ClassParent {
  iri: string;
  count: number;
}

interface ClassBrowserData {
  classPath: ClassParent[];
  limit?: number;
  output_mode?: string;
}

const OUTPUT_TABS = [
  { value: 'hierarchy', label: 'Hierarchy' },
  { value: 'table', label: 'Show Table' },
]


const buildQuery = (data: ClassBrowserData) => {
  const { rdf, rdfs } = PREFIXES;

  let query = SELECT`?type (COUNT(?s) as ?count)`;

  if (!data.classPath?.length) {
    query = query.WHERE`
      ?s ${rdf.type} ?type .
      FILTER NOT EXISTS { ?type ${rdfs.subClassOf} ?parent }
    `;
  } else {
    const parent = data.classPath[data.classPath.length - 1];
    query = query.WHERE`
      ?s ${rdf.type} ?type .
      ?type ${rdfs.subClassOf} ${namedNode(parent.iri)} .
    `;
  }

  query = query.GROUP().BY('type')
    .LIMIT(data.limit ?? 20);

  return {
    primaryQuery: query.build(),
  };
}

export const ClassBrowserWidget = (props: {}) => {
  const { cell, runCell } = useCellContext();
  const { data, source } = cell as WidgetCellType<ClassBrowserData>;
  const [ showSource, setShowSource ] = React.useState(false);
  const [run, setRun] = React.useState(false);

  const { setData } = useCellWidgetData(buildQuery);

  useEffect(() => {
    setData({
      ...data,
    })
  }, []);

  const updateClassPath = useCallback((level: number, head?: ClassParent) => {
    let classPath = (data.classPath ?? []).slice(0, level);
    if (head) {
      classPath.push(head);
    }
    setData({ classPath })
    setRun(true);
  }, [ data.classPath ]);

  useEffect(() => {
    if (run) {
      setRun(false);
      runCell();
    }
  }, [ run ]);

  const classPath = data.classPath ?? [];
  const breadcrumbs = useMemo(() => (
    [
      { iri: 'Root', count: null },
      ...classPath,
    ].map((parent, index) => (
      index === classPath.length ? (
        <Typography key={index} color="text.primary">
          {extractIriLabel(parent.iri)} {parent.count && `(${parent.count})`}
        </Typography>
      ) : (
        <Link key={index} color="inherit" underline="hover" onClick={() => updateClassPath(index, null)}>
          {extractIriLabel(parent.iri)} {parent.count && `(${parent.count})`}
        </Link>
      )
    ))
  ), [ data.classPath ]);

  const Content = useMemo(() => (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <CardHeader
            sx={{ p: 0 }}
            title="Class Browser Widget"
            subheader="Displays subclasses given a parent class"
            action={
              <IconButton aria-label="View source" onClick={() => setShowSource(true)}>
                <CodeIcon/>
              </IconButton>
            }
          />
        </Grid>
        <Grid item xs={12}>
          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" />}
            aria-label="breadcrumb"
          >
            {breadcrumbs}
          </Breadcrumbs>
        </Grid>
        <Grid item xs={12}>
          <Container maxWidth="md">
            <NumberedSlider
              label={'Limit results'}
              value={data?.limit ?? 100}
              valueLabelFormat={(value) => value.toString()}
              onChange={(event, value) => setData({ limit: value as number })}
              min={100} max={1000} step={100}
            />
          </Container>
        </Grid>
      </Grid>
    </>
  ), [ data ]);

  const extraData = useMemo(() => ({
    updateClassPath
  }), [ data.classPath ]);

  console.log('data', extraData);

  return (
    <>
      {Content}
      <CellOutputTabs
        mode={data.output_mode}
        options={OUTPUT_TABS}
        renderResult={ResultTab}
        onChange={(output_mode) => setData({ output_mode })}
        extraData={extraData}
      />
      <SourceViewModal
        source={{
          'Main Query': source[0],
        }}
        open={showSource}
        onClose={() => setShowSource(false)}
      />
    </>
  )
}

const ResultTab = ({
  mode, cell, outputs, updateClassPath
}: {
  mode: string,
  cell: Cell,
  outputs: CellOutput[] | null,
  updateClassPath: (level: number, head?: ClassParent) => void,
}) => {
  const prefixes = usePrefixes();
  const itemsRef = useRef<any>();
  const data = (cell as WidgetCellType<ClassBrowserData>).data;
  const output = outputs[0];

  const onPlotClick = useCallback((event: any) => {
    if (!event.points?.length) {
      return;
    }

    const point = event.points[0];
    for (const item of itemsRef.current ?? []) {
      if (item.label !== point.label) {
        continue;
      }

      updateClassPath(item.level, { iri: item.iri, count: item.count });
      break;
    }
  }, [itemsRef, updateClassPath]);

  if (
    mode === 'hierarchy'
    && output?.output_type === 'execute_result'
    && 'application/sparql-results+json' in output?.data
  ) {
    const results: SparQLResult = JSON.parse(output.data['application/sparql-results+json']);
    const points = results.results.bindings;
    const classPath = data.classPath ?? [];

    let items = [];
    let parent = "";
    let i = 0;
    for (const parentItem of classPath.slice(classPath.length - 1, classPath.length)) {
      items.push({
        label: extractIriLabel(parentItem.iri) + ' ',
        iri: parentItem.iri,
        count: parentItem.count,
        parent,
        level: i++,
      });
      parent = extractIriLabel(parentItem.iri) + ' ';
    }

    items = items.concat(points.map((row) => ({
      label: extractIriLabel(row['typeLabel']?.value ?? row['type'].value),
      count: Number(row['count'].value) || null,
      iri: row['type'].value,
      parent,
      level: data.classPath?.length ?? 0,
    })));
    itemsRef.current = items;

    const labels = items.map((item) => item.label);
    const values = items.map((item) => item.count as any as number);
    const texts = items.map((item) => `${item.label} (${item.count} instances)<br>${item.iri}`);
    const parents = items.map((item) => item.parent);
    console.log(labels, values);

    return (
      <Plot
        data={[
          {
            type: "sunburst",
            labels: labels,
            values: values,
            text: texts,
            parents,
            hoverinfo: "text",
            textinfo: "label",
          }
        ]}
        onClick={onPlotClick}
        style={{ width: "100%" }}
        layout={{
          margin: {l: 0, r: 0, b: 0, t: 0},
          autosize: true,
          height: 400
        }}
      />
    )
  } else {
    const result = cellOutputToYasgui(outputs[0]);
    return (
      <Yasr
        result={result}
        prefixes={prefixes}
      />
    )
  }

  return null;
}
