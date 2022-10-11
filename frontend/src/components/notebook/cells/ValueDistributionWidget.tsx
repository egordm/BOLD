import {
  Button,
  CardHeader, Container, FormControlLabel, FormGroup,
  Grid,
  IconButton,
  Stack, Switch,
  TextField
} from "@mui/material";
import { Variable } from "@rdfjs/types";
import { SELECT, sparql } from "@tpluscode/sparql-builder";
import { WhereBuilder } from "@tpluscode/sparql-builder/lib/partials/WHERE";
import React, { useCallback, useEffect, useMemo } from "react";
import { useCellContext } from "../../../providers/CellProvider";
import { usePrefixes } from "../../../providers/DatasetProvider";
import { useReportContext } from "../../../providers/ReportProvider";
import { CellOutput, WidgetCellType } from "../../../types/notebooks";
import { SPARQLResult } from "../../../types/sparql";
import { Term } from "../../../types/terms";
import { extractIriLabel } from "../../../utils/formatting";
import { PREFIXES, querySparqlLabel } from "../../../utils/sparql";
import { cellOutputToYasgui } from "../../../utils/yasgui";
import { HistogramPlot } from "../../data/HistogramPlot";
import { PiePlot } from "../../data/PiePlot";
import { SourceViewModal } from "../../data/SourceViewModal";
import { Yasr } from "../../data/Yasr";
import { Checkbox } from "../../input/Checkbox";
import { NumberedSlider } from "../../input/NumberedSlider";
import { TermInput } from "../../input/TermInput";
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { variable, literal, namedNode } from '@rdfjs/data-model'
import CodeIcon from '@mui/icons-material/Code';
import { VirtualizedTabs } from "../../layout/VirtualizedTabs";

interface Filter {
  predicate?: Term[];
  object?: Term[];
  negate?: boolean;
}

interface ValueDistributionWidgetData {
  group_predicate?: Term[];
  filters?: Filter[];
  temporal_predicate?: Term[] | null;
  temporal_group_count?: number;
  continuous?: boolean;
  group_count?: number;
  min_group_size?: number;
  output_mode?: 'plot' | 'table';
  visualization_settings?: {
    normalized?: boolean;
    cumulative?: boolean;
  }
}

const MAX_GROUP_COUNT = 101;

const OUTPUT_TABS = [
  { value: 'plot', label: 'Show Plot' },
  { value: 'table', label: 'Show Table' },
  { value: 'examples', label: 'Show Examples' },
  { value: 'completeness', label: 'Completeness Analysis' },
]

const termToSparql = (term: Term) => {
  if (term.type === 'literal') {
    return literal(term.value, term.lang ?? undefined);
  } else {
    return namedNode(term.value);
  }
}

const buildQuery = (data: ValueDistributionWidgetData, triple_count: number) => {
  const { xsd, rdfs } = PREFIXES;

  const groupPredicates = (data.group_predicate ?? []).map(termToSparql);

  const addPrimaryFilter = (query: WhereBuilder<any>) => {
    return query.WHERE`
      VALUES ?p { ${groupPredicates} } 
      ?s ?p ?o
     `;
  }

  const addSecondaryFilters = (query: WhereBuilder<any>) => {
    (data.filters ?? []).forEach((filter, index) => {
      const predicate = filter.predicate?.map(termToSparql) ?? [];
      const object = filter.object?.map(termToSparql) ?? [];

      const predicateVar = variable(`p${index}`);
      const objectVar = variable(`o${index}`);

      const selector = filter.negate
        ? sparql`MINUS { ?s ${predicateVar} ${objectVar} }`
        : sparql`?s ${predicateVar} ${objectVar}`;

      query = query.WHERE`
        VALUES ${predicateVar} { ${predicate} }
        VALUES ${objectVar} { ${object} }
        ${selector}
      `
    });

    return query;
  }

  const addTemporalFilter = (query: WhereBuilder<any>) => {
    const predicate = (data.temporal_predicate ?? []).map(termToSparql);

    return query.WHERE`
      VALUES ?tp { ${predicate} }
      ?s ?tp ?tv
      FILTER(YEAR(xsd:dateTime(?tv)) > -99999)
    `
  }

  const addRangeSubquery = (query: WhereBuilder<any>, variable: string | Variable, prefix: string, count: number) => {
    let subquery = addSecondaryFilters(addPrimaryFilter(
      SELECT`(COALESCE(MIN(${variable}), 0) AS ?${prefix}_min)  (COALESCE(MAX(${variable}), 0) AS ?${prefix}_max)`
    ));
    if (data.temporal_predicate) {
      subquery = addTemporalFilter(subquery);
    }

    return query.WHERE`
      { ${subquery} }
      BIND (((?${prefix}_max - ?${prefix}_min) / ${count}) AS ?${prefix}_step)
    `;
  }

  const discretizeValue = (v: Variable, prefix: string) => {
    return sparql`(0.5 + ${xsd.integer}((${v} - ?${prefix}_min) / ?${prefix}_step)) * ?${prefix}_step + ?${prefix}_min`
  }

  const groupCount =  data.temporal_predicate
      ? (data.temporal_group_count === MAX_GROUP_COUNT ? 1000 : (data.temporal_group_count ?? 20))
      : (data.group_count === MAX_GROUP_COUNT ? 1000 : (data.group_count ?? 20));

  let primaryQuery = SELECT`
    ?g (SAMPLE(?gLabel) AS ?gLabel) 
    (COUNT(?g) as ?count) 
    ${data.temporal_predicate ? '((?tu / 12) as ?t)' : null}`
    .ORDER().BY(variable('count'), true)
    .LIMIT(groupCount) as any;
  primaryQuery = addPrimaryFilter(primaryQuery);
  primaryQuery = addSecondaryFilters(primaryQuery);

  if (data.continuous) {
    primaryQuery = addRangeSubquery(primaryQuery, '?o', 'o', groupCount);
  }

  if (data.continuous) {
    primaryQuery = primaryQuery
      .GROUP().BY(discretizeValue(variable('o'), 'o')).AS('g')
      .HAVING`COUNT(?g) >= ${data.min_group_size ?? 1}`;
  } else {
    primaryQuery = primaryQuery
      .WHERE`
        BIND (?o as ?g)
        ${querySparqlLabel('g')}
      `
      .GROUP().BY('g')
      .HAVING`COUNT(?g) >= ${data.min_group_size ?? 1}`;
  }

  if (data.temporal_predicate) {
    const tempoVar = sparql`(YEAR(${xsd.dateTime}(?tv)) * 12 + MONTH(${xsd.dateTime}(?tv)))`
    primaryQuery = addTemporalFilter(primaryQuery);
    primaryQuery = addRangeSubquery(primaryQuery, tempoVar as any, 't', data.temporal_group_count ?? 20);
    primaryQuery = primaryQuery
      .GROUP().BY(discretizeValue(tempoVar as any, 't')).AS('tu')
  }

  primaryQuery = primaryQuery.build();

  let exampleQuery = SELECT`
    (SAMPLE(?s) AS ?s) (SAMPLE(?sLabel) AS ?sLabel) 
    (SAMPLE(?p) AS ?p) (SAMPLE(?pLabel) AS ?pLabel) 
    ?o (SAMPLE(?oLabel) AS ?oLabel) 
    ${data.temporal_predicate ? '?tv' : null}`;
  exampleQuery = addPrimaryFilter(exampleQuery);
  exampleQuery = exampleQuery.WHERE`
    ${querySparqlLabel('s')}
    ${querySparqlLabel('p')}
    ${querySparqlLabel('o')}
  `;
  exampleQuery = addSecondaryFilters(exampleQuery) as any;
  exampleQuery = exampleQuery.GROUP().BY('o')
  if (data.temporal_predicate) {
    exampleQuery = addTemporalFilter(exampleQuery);
    exampleQuery = exampleQuery.GROUP().BY('tv')
  }
  exampleQuery = exampleQuery.LIMIT(100);
  exampleQuery = exampleQuery.build() as any;

  const completeQuery = addSecondaryFilters(addPrimaryFilter(SELECT`(COUNT(?s) AS ?complete_count)`))
  const allQuery = data.filters?.length > 0
    ? addSecondaryFilters(SELECT`(COUNT(?s) AS ?total_count)`.WHERE`?s ?p ?o`)
    : SELECT`(${triple_count} AS ?total_count)`;
  let completenessQuery = SELECT`*`.WHERE`
    { ${completeQuery} }
    { ${allQuery} }
  `.LIMIT(data.group_count === MAX_GROUP_COUNT ? 1000 : (data.group_count ?? 20)).build()

  return {
    primaryQuery,
    exampleQuery,
    completenessQuery,
  };
}

export const ValueDistributionWidget = (props: {}) => {
  const { report } = useReportContext();
  const { cell, cellRef, outputs, setCell } = useCellContext();
  const { data, source } = cell as WidgetCellType<ValueDistributionWidgetData>;
  const [ showSource, setShowSource ] = React.useState(false);
  const prefixes = usePrefixes();

  useEffect(() => {
    const {
      primaryQuery,
      exampleQuery,
      completenessQuery
    } = buildQuery(data, report?.dataset?.statistics?.triple_count ?? 0);

    setCell({
      ...cell,
      source: [
        primaryQuery,
        exampleQuery,
        completenessQuery,
      ],
    } as any)
  }, [ data ]);

  const setData = useCallback((newData: Partial<ValueDistributionWidgetData>) => {
    const cell = cellRef.current as WidgetCellType<ValueDistributionWidgetData>;

    setCell({
      ...cell,
      data: { ...cell.data, ...newData }
    } as any)
  }, [])

  const onAddFilter = useCallback(() => {
    const data = (cellRef.current as any).data as ValueDistributionWidgetData;

    setData({
      filters: [ ...(data.filters || []), {} ]
    })
  }, [])

  const onUpdateFilter = useCallback((filterIndex: number, newFilter) => {
    const data = (cellRef.current as any).data as ValueDistributionWidgetData;

    setData({
      filters: [
        ...data.filters.slice(0, filterIndex),
        { ...data.filters[filterIndex], ...newFilter },
        ...data.filters.slice(filterIndex + 1)
      ]
    })
  }, [])

  const onDeleteFilter = useCallback((filterIndex: number) => {
    const data = (cellRef.current as any).data as ValueDistributionWidgetData;

    setData({
      filters: [
        ...data.filters.slice(0, filterIndex),
        ...data.filters.slice(filterIndex + 1)
      ]
    })
  }, []);

  const Filters = useMemo(() => {
    return (data?.filters ?? []).map((filter, index) => (
      <Grid container item xs={12} key={index}>
        <Grid item xs={2}>
          <Checkbox
            value={filter.negate ?? false}
            onChange={(e) => onUpdateFilter(index, { negate: e.target.checked })}
            label="Negate"/>
        </Grid>
        <Grid item xs={5}>
          <TermInput
            datasetId={report?.dataset?.id}
            pos={'PREDICATE'}
            label="Filter values of"
            value={filter.predicate ?? []}
            onChange={(value) => onUpdateFilter(index, { predicate: value })}
            prefixes={prefixes}
          />
        </Grid>
        <Grid item xs={5}>
          <Stack direction="row" spacing={2}>
            <TermInput
              sx={{ flex: 1 }}
              datasetId={report?.dataset?.id}
              pos={'OBJECT'}
              label={filter.negate ? "Not matching values" : "Matching values"}
              value={filter.object ?? []}
              onChange={(value) => onUpdateFilter(index, { object: value })}
              prefixes={prefixes}
            />
            <IconButton
              aria-label="delete"
              onClick={() => onDeleteFilter(index)}>
              <DeleteIcon/>
            </IconButton>
          </Stack>
        </Grid>
      </Grid>
    ));
  }, [ data.filters, prefixes ]);

  const TemporalGrouping = useMemo(() => typeof data.temporal_predicate?.length === 'number' ?
    (
      <>
        <Grid item xs={2}/>
        <Grid item xs={10}>
          <Stack direction="row" spacing={2}>
            <TermInput
              sx={{ flex: 1 }}
              datasetId={report?.dataset?.id}
              pos={'PREDICATE'}
              label="Temporally group by"
              value={data.temporal_predicate ?? []}
              onChange={(value) => setData({ temporal_predicate: value })}
              prefixes={prefixes}
            />
            <IconButton
              aria-label="delete"
              onClick={() => setData({ temporal_predicate: null })}>
              <DeleteIcon/>
            </IconButton>
          </Stack>
        </Grid>
        <Grid item xs={12}>
          <Container maxWidth="md">
            <NumberedSlider
              label={'Limit number of timestamps'}
              value={data?.temporal_group_count ?? 20}
              valueLabelFormat={(value) => value !== MAX_GROUP_COUNT ? value.toString() : 'Unlimited'}
              onChange={(event, value) => setData({ temporal_group_count: value as number })}
              min={1} max={MAX_GROUP_COUNT} step={1}
            />
          </Container>
        </Grid>
      </>
    ) : (
      <>
        <Grid item xs={2}/>
        <Grid item xs={10}>
          <Button
            variant="text"
            startIcon={<AddIcon/>}
            onClick={() => setData({ temporal_predicate: [] })}
          > Add temporal grouping</Button>
        </Grid>
      </>
    ), [ data.temporal_predicate, data.temporal_group_count ]);

  const Content = useMemo(() => (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <CardHeader
            sx={{ p: 0 }}
            title="Histogram Builder"
            subheader="Plots distribution of values for a given predicate and a filter"
            action={
              <IconButton sx={{ mr: 3 }} onClick={() => setShowSource(true)}>
                <CodeIcon/>
              </IconButton>
            }
          />
        </Grid>
        <Grid item xs={2}>
          <TextField label="For Subject" value="Any" variant="filled" disabled={true}/>
        </Grid>
        <Grid item xs={8}>
          <TermInput
            datasetId={report?.dataset?.id}
            pos={'PREDICATE'}
            label="Group values of"
            value={data?.group_predicate ?? []}
            onChange={(value) => setData({ group_predicate: value })}
            prefixes={prefixes}
          />
        </Grid>
        <Grid item xs={2}>
          <Checkbox
            value={data?.continuous ?? false}
            onChange={(e) => setData({ continuous: e.target.checked })}
            label="Continuous"/>
        </Grid>
        {Filters}
        <Grid item xs={2}/>
        <Grid item xs={10}>
          <Button variant="text" startIcon={<AddIcon/>} onClick={onAddFilter}> Add filter</Button>
        </Grid>
        <Grid item xs={12}>
          <Container maxWidth="md">
            <NumberedSlider
              label={'Limit number of groups'}
              value={data?.group_count ?? 20}
              valueLabelFormat={(value) => value !== MAX_GROUP_COUNT ? value.toString() : 'Unlimited'}
              onChange={(event, value) => setData({ group_count: value as number })}
              min={1} max={MAX_GROUP_COUNT} step={1}
            />
          </Container>
        </Grid>
        <Grid item xs={12}>
          <Container maxWidth="md">
            <NumberedSlider
              label={'Min group size'}
              value={data?.min_group_size ?? 2}
              onChange={(event, value) => setData({ min_group_size: value as number })}
              min={1} max={20} step={1}
            />
          </Container>
        </Grid>
        {TemporalGrouping}
      </Grid>
    </>
  ), [ data, prefixes ]);

  const Result = useMemo(() => !!outputs?.length && (
    <VirtualizedTabs
      value={data.output_mode ?? 'plot'}
      tabs={OUTPUT_TABS}
      onChange={(event, value) => setData({ output_mode: value as any })}
      renderTab={(tab) => <ResultTab
        mode={tab} outputs={outputs}
        settings={data.visualization_settings ?? {}}
        setData={setData}
      />
      }
    />
  ), [ data.output_mode, outputs, data.visualization_settings ]);

  return (
    <>
      {Content}
      {Result}
      <SourceViewModal
        source={{
          'Main Query': source[0],
          'Example Query': source[1],
          'Completeness Query': source[2],
        }}
        open={showSource}
        onClose={() => setShowSource(false)}
      />
    </>
  )
}

const ResultTab = ({
  outputs, mode, settings, setData
}: {
  outputs: CellOutput[],
  mode: string,
  settings: {
    normalized?: boolean,
    cumulative?: boolean,
  },
  setData: (data: Partial<ValueDistributionWidgetData>) => void,
}) => {
  const prefixes = usePrefixes();

  if (mode === 'plot') {
    const output = outputs[0];
    if (output.output_type === 'execute_result' && 'application/sparql-results+json' in output.data) {
      const data: SPARQLResult = JSON.parse(output.data['application/sparql-results+json']);
      const points = data.results.bindings.filter((row) => row['g']);
      const x = points.map((row) => extractIriLabel(row['gLabel']?.value ?? row['g'].value));
      const y = points.map((row) => row['count']?.value ? (Number(row['count'].value) || null) : null);
      const z = (data?.head?.vars ?? []).includes('t')
        ? points.map((row) => row['t']?.value ? (Number(row['t'].value) || null) : null)
        // ? points.map((row) => row['t']?.value)
        : undefined;
      const { normalized, cumulative } = settings;

      return (
        <Grid container>
          <Grid item xs={12}>
            <FormGroup>
              <FormControlLabel control={<Switch
                checked={normalized ?? false}
                value={normalized ?? false}
                onChange={(event) => setData({
                  visualization_settings: {
                    normalized: event.target.checked,
                    cumulative,
                  }
                })}
              />} label="Normalized"/>
              <FormControlLabel control={<Switch
                checked={cumulative ?? false}
                value={cumulative ?? false}
                onChange={(event) => setData({
                  visualization_settings: {
                    normalized,
                    cumulative: event.target.checked
                  }
                })}
              />} label="Cumulative"/>
            </FormGroup>
          </Grid>
          <Grid item xs={12}>
            <HistogramPlot
              x={x} y={y} z={z}
              normalized={settings.normalized ?? false}
              cumulative={settings.cumulative ?? false}
              layout={{
                xaxis: {
                  title: 'Value',
                },
                yaxis: {
                  title: 'Count',
                }
              }}
            />
          </Grid>
        </Grid>
      )
    }
  } else if (mode === 'table') {
    const result = outputs[0] ? cellOutputToYasgui(outputs[0]) : null;
    return (
      <Yasr
        result={result}
        prefixes={prefixes}
      />
    )
  } else if (mode === 'examples') {
    const result = outputs[1] ? cellOutputToYasgui(outputs[1]) : null;
    return (
      <Yasr
        result={result}
        prefixes={prefixes}
      />
    )
  } else if (mode === 'completeness') {
    const output = outputs[2];
    if (output && output.output_type === 'execute_result' && 'application/sparql-results+json' in output.data) {
      const data: SPARQLResult = JSON.parse(output.data['application/sparql-results+json']);
      const completeCount = data.results.bindings.map((row) => parseInt(row['complete_count'].value))[0] ?? 0;
      const totalCount = data.results.bindings.map((row) => parseInt(row['total_count'].value))[0] ?? 0;


      return (
        <PiePlot values={[
          { label: 'Complete', value: completeCount },
          { label: 'Incomplete', value: totalCount - completeCount },
        ]}/>
      )
    } else {
      const result = outputs[2] ? cellOutputToYasgui(outputs[2]) : null;
      return (
        <Yasr
          result={result}
          prefixes={prefixes}
        />
      )
    }

  }

  return null;
}
