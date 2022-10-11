import React, { useMemo } from "react";
import { usePrefixes } from "../../../../providers/DatasetProvider";
import { Cell, CellOutput } from "../../../../types/notebooks";
import { Prefixes } from "../../../../types/sparql";
import { extractIriLabel, formatIri } from "../../../../utils/formatting";
import { extractSparqlResult } from "../../../../utils/sparql";
import { cellOutputToYasgui } from "../../../../utils/yasgui";
import { Yasr } from "../../../data/Yasr";
import Graph from 'react-vis-network-graph';
import N3 from 'n3';

export const ResultTab = ({
  mode, cell, outputs
}: {
  mode: string,
  cell: Cell,
  outputs: CellOutput[] | null
}) => {
  const prefixes = usePrefixes();

  const graphData = useMemo(() => {
    const result = extractSparqlResult(outputs[0]);
    if (!result) return null;

    return ntriplesToGraph(result as any, prefixes);
  }, [ outputs, mode, prefixes ]);

  if (mode === 'graph' && graphData) {
    return (
      <Graph
        graph={graphData}
        options={GRAPH_OPTIONS}
        getNetwork={network => {
          network.stabilize();
          //  if you want access to vis.js network api you can set the state in a parent component using this property
        }}
      />
    );
  } else {
    return (<Yasr
      result={cellOutputToYasgui(outputs[0])}
      prefixes={prefixes}
    />)
  }
}

const ntriplesToGraph = (ntriples: string, prefixes: Prefixes) => {
  const triples = [];
  const labels = {};

  const parser = new N3.Parser();
  const result = parser.parse(ntriples);
  for (const quad of result) {
    if(quad?.predicate && quad.predicate.id === "http://www.w3.org/1999/02/22-rdf-syntax-ns#label") {
      labels[quad.subject.id] = quad.object.value;
    } else if(quad?.predicate && quad?.subject && quad?.object) {
      triples.push(quad);
    }
  }

  const nodes = {};
  const edges = [];

  const withNode = (id) => {
    if (!nodes[id]) {
      nodes[id] = {
        id: id,
        label: labels[id] ?? extractIriLabel(id),
        title: formatIri(id, prefixes || {}),
      }
    }
    return nodes[id];
  }

  for (const { subject, object, predicate } of triples) {
    const from = withNode(object.id);
    const to = withNode(subject.id);
    edges.push({
      from: from.id,
      to: to.id,
      label: labels[predicate.id] ?? extractIriLabel(predicate.id),
      title: formatIri(predicate.id, prefixes || {}),
    });
  }

  return {
    nodes: Object.values(nodes),
    edges
  };
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
