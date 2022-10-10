import {
  CardHeader, Container, Grid,
  IconButton
} from "@mui/material";
import { variable } from "@rdfjs/data-model";
import { SELECT} from "@tpluscode/sparql-builder";
import _ from "lodash";
import React, { useMemo } from "react";
import { useCellWidgetData } from "../../../hooks/useCellWidgetData";
import { useCellContext } from "../../../providers/CellProvider";
import { usePrefixes } from "../../../providers/DatasetProvider";
import { useReportContext } from "../../../providers/ReportProvider";
import { Cell, CellOutput, WidgetCellType } from "../../../types/notebooks";
import { Term } from "../../../types/terms";
import { extractIriLabel, formatIri } from "../../../utils/formatting";
import { extractSparqlResult, querySparqlLabel, termToSparql } from "../../../utils/sparql";
import { cellOutputToYasgui } from "../../../utils/yasgui";
import { SourceViewModal } from "../../data/SourceViewModal";
import { Yasr } from "../../data/Yasr";
import { Checkbox } from "../../input/Checkbox";
import { NumberedSlider } from "../../input/NumberedSlider";
import CodeIcon from '@mui/icons-material/Code';
import { TermInput } from "../../input/TermInput";
import { CellOutputTabs } from "../outputs/CellOutputTabs";
import Graph from 'react-vis-network-graph';


interface SubgraphWidgetData {
  entity?: Term[];
  predicates?: Term[];
  anyPredicate?: boolean;
  limit?: number;
  depth?: number;
  output_mode?: string;
}

const OUTPUT_TABS = [
  { value: 'graph', label: 'Graph' },
  { value: 'tableIn', label: 'Show Table (In)' },
  { value: 'tableOut', label: 'Show Table (Out)' },
]


const buildQuery = (data: SubgraphWidgetData) => {
  const buildDirectedQuery = (inwards: boolean, depth: number, limit: number) => {
    const selectCols = [ variable('o'), variable('oLabel') ];
    _.range(depth).forEach((i) => {
      selectCols.push(variable(`p${i}`));
      selectCols.push(variable(`p${i}Label`));
      selectCols.push(variable(`s${i}`));
      selectCols.push(variable(`s${i}Label`));
    });

    const object = data.entity?.map(termToSparql) ?? [];
    let query = SELECT`${selectCols}`
      .WHERE`
        VALUES ?o { ${object} }
        ${querySparqlLabel(`o`)}
      `
      .LIMIT(Math.ceil(limit / depth));

    _.range(depth).forEach((i) => {
      if (!(data?.anyPredicate ?? true)) {
        const predicates = data.predicates?.map(termToSparql) ?? [];
        query = query.WHERE`VALUES ?p${i} { ${predicates} }`;
      }

      if (i === 0) {
        if (inwards) {
          query = query.WHERE`?s${i} ?p${i} ?o`;
        } else {
          query = query.WHERE`?o ?p${i} ?s${i}`;
        }
      } else {
        if (inwards) {
          query = query.WHERE`OPTIONAL { ?s${i} ?p${i} ?s${i - 1} }`;
        } else {
          query = query.WHERE`OPTIONAL { ?s${i - 1} ?p${i} ?s${i} }`;
        }
      }
      query = query.WHERE`FILTER(!isLiteral(?s${i}) || langMatches(lang(?s${i}), "en"))`
      query = query.WHERE`
        ${querySparqlLabel(`s${i}`)}
        ${querySparqlLabel(`p${i}`)}
      `
    });

    return query;
  }

  const limit = data.limit ?? 100;
  const depth = data.depth ?? 1;

  return {
    queryIn: buildDirectedQuery(true, depth, Math.round(limit / 2)).build(),
    queryOut: buildDirectedQuery(false, depth, Math.round(limit / 2)).build(),
  };
}

export const SubgraphWidget = (props: {}) => {
  const { report } = useReportContext();
  const { cell } = useCellContext();
  const { data, source } = cell as WidgetCellType<SubgraphWidgetData>;
  const [ showSource, setShowSource ] = React.useState(false);
  const { setData } = useCellWidgetData(buildQuery);
  const prefixes = usePrefixes();

  const Content = useMemo(() => (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <CardHeader
            sx={{ p: 0 }}
            title="Subgraph Widget"
            subheader="Displays a subgraph consisting os triples around a chosen entity."
            action={
              <IconButton aria-label="View source" onClick={() => setShowSource(true)}>
                <CodeIcon/>
              </IconButton>
            }
          />
        </Grid>
        <Grid item xs={12}>
          <TermInput
            datasetId={report?.dataset?.id}
            pos={'SUBJECT'}
            label="Create subgraph for"
            value={data.entity ?? []}
            onChange={(value) => setData({ entity: value })}
            prefixes={prefixes}
          />
        </Grid>
        <Grid item xs={2}>
          <Checkbox
            value={data.anyPredicate ?? true}
            onChange={(e) => setData({ anyPredicate: e.target.checked })}
            label="Use any property"/>
        </Grid>
        <Grid item xs={10}>
          <TermInput
            datasetId={report?.dataset?.id}
            pos={'PREDICATE'}
            label="Limit properties to"
            disabled={data.anyPredicate ?? true}
            value={data.predicates ?? []}
            onChange={(value) => setData({ predicates: value })}
            prefixes={prefixes}
          />
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
          <Container maxWidth="md">
            <NumberedSlider
              label={'Limit depth'}
              value={data?.depth ?? 1}
              valueLabelFormat={(value) => value.toString()}
              onChange={(event, value) => setData({ depth: value as number })}
              min={1} max={5} step={1}
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
          'In Query': source[0],
          'Out Query': source[1],
        }}
        open={showSource}
        onClose={() => setShowSource(false)}
      />
    </>
  )
}

const ResultTab = ({
  mode, cell, outputs
}: {
  mode: string,
  cell: Cell,
  outputs: CellOutput[] | null
}) => {
  const prefixes = usePrefixes();
  const data = (cell as WidgetCellType<SubgraphWidgetData>).data;

  if (mode === 'graph' && outputs[0]?.output_type === 'execute_result' && outputs[1]?.output_type === 'execute_result') {
    const outputIn = extractSparqlResult(outputs[0]);
    const outputOut = extractSparqlResult(outputs[1]);

    const depth = (outputIn.head.vars.length - 1) / 2;
    const nodes = {};
    const edges = [];
    let nodeCounter = 0;

    const addNode = (term: { type: string, value: string }, labelTerm?: { value: string }) => {
      if (nodes[term.value]) {
        return nodes[term.value].id;
      }

      const iri = term.type === 'uri' ? formatIri(term.value, prefixes || {}) : term.value;
      const label = labelTerm?.value ?? (term.type === 'uri' ? extractIriLabel(term.value) : term.value);
      const id = nodeCounter++;
      nodes[term.value] = {
        id: id,
        label: _.truncate(label, { length: 30 }),
        title: iri,
      }

      return id;
    }

    _.range(depth).forEach((i) => {
      const target = i > 0 ? `s${i - 1}` : 'o';

      outputIn.results.bindings.forEach((row) => {
        if (row[`s${i}`] && row[`p${i}`]) {
          let dst = addNode(row[target], row[`${target}Label`]);
          let src = addNode(row[`s${i}`], row[`s${i}Label`]);
          edges.push({
            from: src,
            to: dst,
            label: extractIriLabel(row[`p${i}`].value),
            title: formatIri(row[`p${i}`].value, prefixes || {}),
          })
        }
      })

      outputOut.results.bindings.forEach((row) => {
        if (row[`s${i}`] && row[`p${i}`]) {
          let src = addNode(row[target], row[`${target}Label`]);
          let dst = addNode(row[`s${i}`], row[`s${i}Label`]);
          edges.push({
            from: src,
            to: dst,
            label: extractIriLabel(row[`p${i}`].value),
            title: formatIri(row[`p${i}`].value, prefixes || {}),
          })
        }
      })
    })

    const graph = {
      nodes: Object.values(nodes),
      edges
    };

    return (
      <Graph
        graph={graph as any}
        options={GRAPH_OPTIONS}
        getNetwork={network => {
          network.stabilize();
          //  if you want access to vis.js network api you can set the state in a parent component using this property
        }}
      />
    );
  } else if (outputs?.length > 1 && mode === 'tableOut') {
    const result = cellOutputToYasgui(outputs[1]);
    return (
      <Yasr
        result={result}
        prefixes={prefixes}
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


const GRAPH_OPTIONS = {
  layout: {
    improvedLayout: true
  },
  edges: {
    color: "#000000",
    length: 300
  },
  height: "500px",
  physics: {
    // Even though it's disabled the options still apply to network.stabilize().
    enabled: false,
    solver: "repulsion",
    repulsion: {
      nodeDistance: 400 // Put more distance between the nodes.
    }
  }
};
