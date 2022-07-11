import {
  Button,
  CardHeader, Checkbox, Container, FormControlLabel, FormGroup,
  Grid,
  IconButton,
  Stack, Switch,
  TextField
} from "@mui/material";
import { Variable } from "@rdfjs/types";
import { Select, SELECT, sparql } from "@tpluscode/sparql-builder";
import { WhereBuilder } from "@tpluscode/sparql-builder/lib/partials/WHERE";
import React, { useCallback, useEffect, useMemo } from "react";
import { useCellContext } from "../../../providers/CellProvider";
import { usePrefixes, useReportContext } from "../../../providers/ReportProvider";
import { CellOutput, WidgetCellType } from "../../../types/notebooks";
import { SparQLResult } from "../../../types/sparql";
import { Term } from "../../../types/terms";
import { extractIriLabel } from "../../../utils/formatting";
import { cellOutputToYasgui } from "../../../utils/yasgui";
import { HistogramPlot } from "../../data/HistogramPlot";
import { SourceViewModal } from "../../data/SourceViewModal";
import { Yasr } from "../../data/Yasr";
import { NumberedSlider } from "../../input/NumberedSlider";
import { TermInput } from "../../input/TermInput";
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { variable, literal, namedNode } from '@rdfjs/data-model'
import CodeIcon from '@mui/icons-material/Code';
import { VirtualizedTabs } from "../../layout/VirtualizedTabs";

interface ValueDistributionWidgetData {
  group_predicate?: Term[];
  filters?: {
    predicate?: Term[];
    object?: Term[];
  }[];
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
  { value: 'examples', label: 'Show Example Matches' },
]

const termToSparql = (term: Term) => {
  if (term.type === 'literal') {
    return literal(term.value, term.lang ?? undefined);
  } else {
    return namedNode(term.value);
  }
}


const buildQuery = (data: ValueDistributionWidgetData) => {
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

      query = query.WHERE`
        VALUES ${predicateVar} { ${predicate} }
        VALUES ${objectVar} { ${object} }
        ?s ${predicateVar} ${objectVar}
      `
    });

    return query;
  }

  const addTemporalFilter = (query: WhereBuilder<any>) => {
    const predicate = (data.temporal_predicate ?? []).map(termToSparql);

    return query.WHERE`
      VALUES ?tp { ${predicate} }
      ?s ?tp ?tv
    `
  }

  const addRangeSubquery = (query: WhereBuilder<any>, variable: string | Variable, prefix: string, count: number) => {
    let subquery = addSecondaryFilters(addPrimaryFilter(
      SELECT`(MIN(${variable}) AS ?${prefix}_min)  (MAX(${variable}) AS ?${prefix}_max)`
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
    return sparql`(0.5 + xsd:integer((${v} - ?${prefix}_min) / ?${prefix}_step)) * ?${prefix}_step + ?${prefix}_min`
  }

  const groupCount = data.group_count === MAX_GROUP_COUNT ? 1000 : (data.group_count ?? 20);

  let primaryQuery = SELECT`?g (COUNT(?g) as ?count) ${data.temporal_predicate ? '?t' : null}`
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
      .HAVING`?count >= ${data.min_group_size ?? 1}`;
  } else {
    primaryQuery = primaryQuery
      .WHERE`BIND (?o as ?g)`
      .GROUP().BY('g')
      .HAVING`?count >= ${data.min_group_size ?? 1}`;
  }

  if (data.temporal_predicate) {
    primaryQuery = addTemporalFilter(primaryQuery);
    primaryQuery = addRangeSubquery(primaryQuery, '?tv', 't', data.temporal_group_count ?? 20);
    primaryQuery = primaryQuery
      .GROUP().BY(discretizeValue(variable('tv'), 't')).AS('t')
  }

  primaryQuery = primaryQuery.build()

  return primaryQuery;
}

const buildExamplesQuery = (data: ValueDistributionWidgetData) => {
  const groupPredicates = (data.group_predicate ?? []).map(termToSparql);

  let query = SELECT`?s ?p ?o`
    .WHERE`
      VALUES ?p { ${groupPredicates} } 
      ?s ?p ?o
     `;

  (data.filters ?? []).forEach((filter, index) => {
    const predicate = filter.predicate?.map(termToSparql) ?? [];
    const object = filter.object?.map(termToSparql) ?? [];

    const predicateVar = variable(`p${index}`);
    const objectVar = variable(`o${index}`);

    query = query.WHERE`
      VALUES ${predicateVar} { ${predicate} }
      VALUES ${objectVar} { ${object} }
      ?s ${predicateVar} ${objectVar}
    `
  });

  query = query
    .LIMIT(100);

  return query.build();
}

export const ValueDistributionWidget = (props: {}) => {
  const { report } = useReportContext();
  const { cell, cellRef, outputs, setCell } = useCellContext();
  const { data, source } = cell as WidgetCellType<ValueDistributionWidgetData>;
  const [ showSource, setShowSource ] = React.useState(false);

  useEffect(() => {
    const query = buildQuery(data);
    const examplesQuery = buildExamplesQuery(data);
    setCell({
      ...cell,
      source: [
        query,
        examplesQuery,
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
        <Grid item xs={2}/>
        <Grid item xs={5}>
          <TermInput
            datasetId={report?.dataset?.id}
            pos={'PREDICATE'}
            label="Filter values of"
            value={filter.predicate ?? []}
            onChange={(value) => onUpdateFilter(index, { predicate: value })}
          />
        </Grid>
        <Grid item xs={5}>
          <Stack direction="row" spacing={2}>
            <TermInput
              sx={{ flex: 1 }}
              datasetId={report?.dataset?.id}
              pos={'OBJECT'}
              label="Matching values"
              value={filter.object ?? []}
              onChange={(value) => onUpdateFilter(index, { object: value })}
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
  }, [ data.filters ]);

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
            title="Value Distribution Query Builder"
            subheader="Plots distribution of values for a given predicate and a filter"
            action={
              <IconButton aria-label="View source" onClick={() => setShowSource(true)}>
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
          />
        </Grid>
        <Grid item xs={2}>
          <FormGroup>
            <FormControlLabel
              control={<Checkbox
                value={data?.continuous ?? false}
                checked={data?.continuous ?? false}
                onChange={(event) => setData({ continuous: event.target.checked })}
              />}
              label="Continuous"/>
          </FormGroup>
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
  ), [ data ]);

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
      const data: SparQLResult = JSON.parse(output.data['application/sparql-results+json']);
      const points = data.results.bindings.filter((row) => row['g']);
      const x = points.map((row) => extractIriLabel(row['g'].value));
      const y = points.map((row) => parseInt(row['count'].value));
      const z = (data?.head?.vars ?? []).includes('t')
        ? points.map((row) => parseInt(row['t'].value))
        : undefined;
      const { normalized, cumulative } = settings;

      return (
        <Grid container>
          <Grid item xs={12}>
            <FormGroup>
              <FormControlLabel control={<Switch
                value={normalized ?? false}
                onChange={(event) => setData({
                  visualization_settings: {
                    normalized: event.target.checked,
                    cumulative,
                  }
                })}
              />} label="Normalized"/>
              <FormControlLabel control={<Switch
                value={cumulative ?? false}
                onChange={(event) => setData({ visualization_settings: { normalized, cumulative: event.target.checked } })}
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
    const result = cellOutputToYasgui(outputs[0]);
    return (
      <Yasr
        result={result}
        prefixes={prefixes}
      />
    )
  } else if (mode === 'examples') {
    const result = cellOutputToYasgui(outputs[1]);
    return (
      <Yasr
        result={result}
        prefixes={prefixes}
      />
    )
  }

  return null;
}
