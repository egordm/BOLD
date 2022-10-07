import {
  CardHeader, Container, Grid,
  IconButton
} from "@mui/material";
import { variable } from "@rdfjs/data-model";
import { SELECT } from "@tpluscode/sparql-builder";
import React, { useEffect, useMemo, useRef } from "react";
import Plot from "react-plotly.js";
import { useCellWidgetData } from "../../../hooks/useCellWidgetData";
import { useCellContext } from "../../../providers/CellProvider";
import { usePrefixes } from "../../../providers/ReportProvider";
import { Cell, CellOutput, WidgetCellType } from "../../../types/notebooks";
import { extractIriLabel } from "../../../utils/formatting";
import { extractSparqlResult, PREFIXES } from "../../../utils/sparql";
import { cellOutputToYasgui } from "../../../utils/yasgui";
import { SourceViewModal } from "../../data/SourceViewModal";
import { Yasr } from "../../data/Yasr";
import { NumberedSlider } from "../../input/NumberedSlider";
import CodeIcon from '@mui/icons-material/Code';
import { CellOutputTabs } from "../outputs/CellOutputTabs";

interface ClassBrowserData {
  limit?: number;
  output_mode?: string;
}

const OUTPUT_TABS = [
  { value: 'sunburst', label: 'Sunburst' },
  { value: 'treemap', label: 'Treemap' },
  { value: 'tableHierarchy', label: 'Show Hierarchy Data' },
  { value: 'tableCounts', label: 'Show Counts Data' },
]

const buildQuery = (data: ClassBrowserData) => {
  const { rdf, rdfs } = PREFIXES;

  const primaryQuery = SELECT`?type ?parent`
    .WHERE`
      ?type ${rdfs.subClassOf} ?parent .
    `.LIMIT(data.limit ?? 20);

  const secondaryQuery = SELECT`?type (COUNT(?s) as ?count)`
    .WHERE`
      ?s ${rdf.type} ?type .
    `
    .GROUP().BY('type')
    .ORDER().BY(variable('count'), true)
    .LIMIT(data.limit ?? 20);

  return {
    primaryQuery: primaryQuery.build(),
    secondaryQuery: secondaryQuery.build(),
  };
}


export const ClassBrowserWidget = (props: {}) => {
  const { cell } = useCellContext();
  const { data, source } = cell as WidgetCellType<ClassBrowserData>;
  const [ showSource, setShowSource ] = React.useState(false);
  const { setData } = useCellWidgetData(buildQuery);

  useEffect(() => {
    setData({
      ...data,
    })
  }, []);


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
          <Container maxWidth="md">
            <NumberedSlider
              label={'Limit results'}
              value={data?.limit ?? 100}
              valueLabelFormat={(value) => value.toString()}
              onChange={(event, value) => setData({ limit: value as number })}
              min={100} max={5000} step={200}
            />
          </Container>
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
      />
      <SourceViewModal
        source={{
          'Hierarchy Query': source[0],
          'Count Query': source[1],
        }}
        open={showSource}
        onClose={() => setShowSource(false)}
      />
    </>
  )
}

interface ClassParent {
  iri: string;
  label: string;
  count: number;
  parents: string[];
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

  const hierarchy = useMemo(() => extractClassHierarchy(outputs), [ outputs ]);

  console.log(hierarchy)

  if ((mode === 'sunburst' || mode === 'treemap') && hierarchy) {
    return (
      <Plot
        data={[
          {
            type: mode,
            ...hierarchy,
            hoverinfo: "text",
            textinfo: "label",
          }
        ]}
        style={{ width: "100%" }}
        layout={{
          margin: { l: 0, r: 0, b: 0, t: 0 },
          autosize: true,
          height: 400
        }}
      />
    )
  } else {
    return (
      <Yasr
        result={cellOutputToYasgui(mode === 'tableCounts' ? outputs[1] : outputs[0])}
        prefixes={prefixes}
      />
    )
  }

  return null;
}


const extractClassHierarchy = (outputs: CellOutput[] | null) => {
  if (!outputs?.length) {
    return null;
  }

  const hierarchyOutput = extractSparqlResult(outputs[0])?.results?.bindings;
  const countsOutput = extractSparqlResult(outputs[1])?.results?.bindings;

  if (!hierarchyOutput || !countsOutput) {
    return null;
  }

  let items: Record<string, ClassParent> = {};
  for (const row of hierarchyOutput) {
    const type = row?.type?.value;
    const parent = row?.parent?.value;
    if (parent && !items[parent]) {
      items[parent] = {
        iri: parent,
        label: extractIriLabel(parent),
        parents: [],
        count: 0,
      };
    }

    if (!items[type]) {
      items[type] = {
        iri: type,
        label: type,
        parents: [],
        count: 0,
      };
    }

    const item = items[type];
    item.iri = type;
    item.label = extractIriLabel(row?.typeLabel?.value ?? type);
    item.parents.push(parent);
  }

  for (const row of countsOutput) {
    const type = row?.type?.value;
    const count = row?.count?.value;
    if (items[type]) {
      items[type].count = parseInt(count);
    } else {
      items[type] = {
        iri: type,
        label: extractIriLabel(type),
        parents: [],
        count: parseInt(count),
      };
    }
  }

  const children = {};
  for (const item of Object.values(items)) {
    for (const parent of item.parents) {
      if (!children[parent]) {
        children[parent] = [];
      }
      children[parent].push(item.iri);
    }
  }

  let visited = {};
  const updateCounts = (item: ClassParent) => {
    if (!item || visited[item.iri]) {
      return;
    }
    visited[item.iri] = true;
    for (const child of children[item.iri] ?? []) {
      updateCounts(items[child]);
      item.count += items[child].count;
    }
  }
  for (const item of Object.values(items)) {
    updateCounts(item);
  }

  const ids = [];
  const labels = [];
  const counts = [];
  const parents = [];
  const texts = [];
  let idCounter = 0;

  // Adds same item twice wit different id if it has multiple parents
  let visited2 = {};
  const addNode = (item: ClassParent, parent: any) => {
    if (visited2[item.iri]) {
      return;
    }
    visited[item.iri] = true;
    visited2[item.iri] = true;
    const id = idCounter++;
    ids.push(id);
    labels.push(item.label);
    counts.push(item.count);
    parents.push(parent);
    texts.push(`${item.label} (${item.count} instances)<br>${item.iri}`);
    for (const child of children[item.iri] ?? []) {
      addNode(items[child], id);
    }
  }
  for (const item of Object.values(items)) {
    if (!item.parents.length) {
      addNode(item, "");
    }
  }

  return ids ? {
    ids,
    labels,
    values: counts,
    parents,
    text: texts,
  } : null;
}
