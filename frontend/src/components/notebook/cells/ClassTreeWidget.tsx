import {
  CardHeader, Container, FormControl, FormControlLabel, FormGroup,
  Grid,
  IconButton, FormLabel
} from "@mui/material";
import { variable } from "@rdfjs/data-model";
import { SELECT, sparql } from "@tpluscode/sparql-builder";
import React, { useEffect, useMemo } from "react";
import { useCellWidgetData } from "../../../hooks/useCellWidgetData";
import { useCellContext } from "../../../providers/CellProvider";
import { usePrefixes } from "../../../providers/ReportProvider";
import { Cell, CellOutput, CellTypeWidget, WidgetCellType } from "../../../types/notebooks";
import { formatBinding, formatIri } from "../../../utils/formatting";
import { extractSparqlResult, PREFIXES } from "../../../utils/sparql";
import { cellOutputToYasgui } from "../../../utils/yasgui";
import { SourceViewModal } from "../../data/SourceViewModal";
import { Yasr } from "../../data/Yasr";
import { Checkbox } from "../../input/Checkbox";
import { NumberedSlider } from "../../input/NumberedSlider";
import CodeIcon from '@mui/icons-material/Code';
import { CellOutputTabs } from "../outputs/CellOutputTabs";
import { TreeItem, TreeView } from "@mui/lab";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

interface ClassTreeWidgetData {
  withCounts?: boolean;
  withSubs?: boolean;
  withEquivs?: boolean;
  withKeys?: boolean;
  withProps?: boolean;
  owlClasses?: boolean;
  rdfClasses?: boolean;
  anyClass?: boolean;
  limit?: number;
  output_mode?: string;

}

const OUTPUT_TABS = [
  { value: 'hierarchy', label: 'Hierarchy' },
  { value: 'table', label: 'Show Table' },
]


const buildQuery = (data: ClassTreeWidgetData) => {
  const { rdf, rdfs, owl } = PREFIXES;

  let primaryQuery = SELECT`
    ?class
    ${data.withSubs ? sparql`(GROUP_CONCAT(distinct ?subOf;SEPARATOR=",") AS ?subsOf)` : ''}
    ${data.withEquivs ? sparql`(GROUP_CONCAT(distinct ?equiv;SEPARATOR=",") AS ?equivs)` : ''}
    ${data.withKeys ? sparql`(GROUP_CONCAT(distinct ?key;SEPARATOR=",") AS ?keys)` : ''}
    ${data.withProps ? sparql`(GROUP_CONCAT(distinct ?prop;SEPARATOR=",") AS ?props)` : ''}
    ${data.withCounts ? sparql`(COUNT(?s) AS ?count)` : ''}
  `.WHERE`
    ?class ${rdf.type} ?ty .
    ?s ?p ?class .
    ${data.withSubs ? sparql`OPTIONAL { ?class ${rdfs.subClassOf} ?subOf . } .` : ''}
    ${data.withEquivs ? sparql`OPTIONAL { ?class ${owl.equivalentClass} ?equiv . } .` : ''}
    ${data.withKeys ? sparql`OPTIONAL { ?class ${owl.hasKey} ?keylist . ?keylist ${rdf.rest}*/${rdf.first} ?key . } .` : ''}
    ${data.withProps ? sparql`OPTIONAL { ?prop rdfs:domain ?class . } .` : ''}
  `.GROUP().BY('class')
    .LIMIT(data.limit ?? 20);

  if (!data.anyClass) {
    const values = [
      ...(data.owlClasses ? [ owl.Class ] : []),
      ...(data.rdfClasses ? [ rdfs.Class ] : []),
    ]
    primaryQuery = primaryQuery.WHERE`
      VALUES ?ty { ${values} }
    ` as any;
  }

  if (data.withCounts) {
    primaryQuery = primaryQuery.ORDER().BY(variable('count'), true);
  }

  return {
    primaryQuery: primaryQuery.build(),
  };
}

export const ClassTreeWidget = (props: {}) => {
  const { cell } = useCellContext();
  const { data, source } = cell as WidgetCellType<ClassTreeWidgetData>;
  const [ showSource, setShowSource ] = React.useState(false);

  const { setData } = useCellWidgetData(buildQuery);

  useEffect(() => {
    setData({
      withCounts: true,
      withSubs: true,
      withEquivs: true,
      withKeys: true,
      withProps: true,
      owlClasses: true,
      rdfClasses: true,
      anyClass: false,
      ...data,
    })
  }, []);

  const Content = useMemo(() => (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <CardHeader
            sx={{ p: 0 }}
            title="Class Tree Widget"
            subheader="Displays a two level class hierarchy of the dataset"
            action={
              <IconButton aria-label="View source" onClick={() => setShowSource(true)}>
                <CodeIcon/>
              </IconButton>
            }
          />
        </Grid>
        <Grid item xs={6}>
          <FormControl sx={{ m: 3 }} component="fieldset" variant="standard">
            <FormLabel component="legend">General Settings</FormLabel>
            <FormGroup>
              <Checkbox
                value={data.withCounts ?? true}
                onChange={(e) => setData({ withCounts: e.target.checked })}
                label="With Counts"/>
              <Checkbox
                value={data.withSubs ?? true}
                onChange={(e) => setData({ withSubs: e.target.checked })}
                label="With Subclasses"/>
              <Checkbox
                value={data.withEquivs ?? true}
                onChange={(e) => setData({ withEquivs: e.target.checked })}
                label="With Equivalent Classes"/>
              <Checkbox
                value={data.withKeys ?? true}
                onChange={(e) => setData({ withKeys: e.target.checked })}
                label="With Keys"/>
              <Checkbox
                value={data.withProps}
                onChange={(e) => setData({ withProps: e.target.checked })}
                label="With Properties"/>
            </FormGroup>
          </FormControl>
        </Grid>
        <Grid item xs={6}>
          <FormControl sx={{ m: 3 }} component="fieldset" variant="standard">
            <FormLabel component="legend">Class Type</FormLabel>
            <FormGroup>
              <Checkbox
                value={data.owlClasses ?? true}
                onChange={(e) => setData({ owlClasses: e.target.checked })}
                label="Use OWL Classes"/>
              <Checkbox
                value={data.rdfClasses ?? true}
                onChange={(e) => setData({ rdfClasses: e.target.checked })}
                label="Use RDF Classes"/>
              <Checkbox
                value={data.anyClass}
                onChange={(e) => setData({ anyClass: e.target.checked })}
                label="Use Any Classes"/>
            </FormGroup>
          </FormControl>
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
  ), [ data, data.owlClasses ]);

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
          'Main Query': source[0],
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
  const data = (cell as WidgetCellType<ClassTreeWidgetData>).data;

  if (mode === 'hierarchy' && outputs[0]?.output_type === 'execute_result') {
    const output = extractSparqlResult(outputs[0]);
    let nodeId = 0;
    const tree = output.results.bindings.map((row, i) => {
      const classIri = row['class']?.value;
      const formattedIri = row['class']?.type === 'uri' ? formatIri(classIri, prefixes || {}) : classIri;

      const formatSplit = (value: string): string[] => value?.split(',')?.filter((x) => !!x)?.map(formatIri as any) || [];
      const count = row['count']?.value;
      const children = [];
      if (data.withSubs ?? true) {
        children.push(formatCategory('Parents', formatSplit(row['subsOf']?.value)))
      }
      if (data.withEquivs ?? true) {
        children.push(formatCategory('Equivalent To', formatSplit(row['equiv']?.value)))
      }
      if (data.withKeys ?? true) {
        children.push(formatCategory('Keys', formatSplit(row['key']?.value)))
      }
      if (data.withProps) {
        children.push(formatCategory('Properties', formatSplit(row['props']?.value)))
      }

      return {
        id: nodeId++,
        name: `${formattedIri} ${count ? `(${count})` : ''}`,
        children
      }
    });

    return (
      <TreeView
        defaultCollapseIcon={<ExpandMoreIcon/>}
        defaultExpandIcon={<ChevronRightIcon/>}
        sx={{ height: 300, flexGrow: 1, overflowY: 'auto' }}
      >
        {tree.map(renderTree)}
      </TreeView>
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

const formatCategory = (name: string, children: string[]) => {
  return {
    id: name,
    name: `${name} (${children.length})`,
    children: children.map((child) => ({
      id: child,
      name: child,
    })),
  }
}

interface RenderTree {
  id: string;
  name: string;
  children?: readonly RenderTree[];
}


const renderTree = (nodes: RenderTree) => (
  <TreeItem key={nodes.id} nodeId={nodes.id.toString()} label={nodes.name}>
    {Array.isArray(nodes.children)
      ? nodes.children.map((node) => renderTree(node))
      : null}
  </TreeItem>
);
