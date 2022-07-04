import {
  Button,
  CardHeader, Container,
  Grid,
  IconButton,
  Input,
  Modal,
  Slider,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { Box } from "@mui/system";
import { SELECT } from "@tpluscode/sparql-builder";
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
  group_count?: number;
  min_group_size?: number;
  output_mode?: 'plot' | 'table';
}

const MAX_GROUP_COUNT = 101;

const OUTPUT_TABS = [
  { value: 'plot', label: 'Show Plot' },
  { value: 'table', label: 'Show Table' },
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

  let query = SELECT`?v (COUNT(?v) as ?count)`
    .WHERE`
      VALUES ?p { ${groupPredicates} } 
      ?s ?p ?v
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

  const groupCount = data.group_count === MAX_GROUP_COUNT ? 1000 : (data.group_count ?? 20);

  query = query
    .GROUP().BY(variable('v')).HAVING`?count >= ${data.min_group_size ?? 1}`
    .ORDER().BY(variable('count'), true)
    .LIMIT(groupCount);

  return query.build();
}

export const ValueDistributionWidget = (props: {}) => {
  const { report } = useReportContext();
  const { cell, cellRef, outputs, setCell } = useCellContext();
  const { data, source } = cell as WidgetCellType<ValueDistributionWidgetData>;
  const [ showSource, setShowSource ] = React.useState(false);

  useEffect(() => {
    const query = buildQuery(data);
    setCell({
      ...cell,
      source: [
        query
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
  }, [])

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
        <Grid item xs={10}>
          <TermInput
            datasetId={report?.dataset?.id}
            pos={'PREDICATE'}
            label="Group values of"
            value={data?.group_predicate ?? []}
            onChange={(value) => setData({ group_predicate: value })}
          />
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
      </Grid>
    </>
  ), [ data ]);

  const Result = useMemo(() => !!outputs?.length && (
    <VirtualizedTabs
      value={data.output_mode ?? 'plot'}
      tabs={OUTPUT_TABS}
      onChange={(event, value) => setData({ output_mode: value as any })}
      renderTab={(tab) => <ResultTab mode={tab} outputs={outputs}/>}
    />
  ), [ data.output_mode, outputs ]);

  return (
    <>
      {Content}
      {Result}
      <SourceViewModal
        source={source}
        open={showSource}
        onClose={() => setShowSource(false)}
      />
    </>
  )
}

const ResultTab = ({ outputs, mode }: { outputs: CellOutput[], mode: string }) => {
  const prefixes = usePrefixes();
  const output = outputs[0];

  if (mode === 'plot') {
    if (output.output_type === 'execute_result' && 'application/sparql-results+json' in output.data) {
      const data: SparQLResult = JSON.parse(output.data['application/sparql-results+json']);
      const x = data.results.bindings.map((row) => extractIriLabel(row['v'].value));
      const y = data.results.bindings.map((row) => parseInt(row['count'].value));

      return (
        <HistogramPlot
          x={x} y={y}
          layout={{
            xaxis: {
              title: 'Value',
            },
            yaxis: {
              title: 'Count',
            }
          }}
        />
      )
    }
  } else if (mode === 'table') {
    const result = cellOutputToYasgui(output);
    return (
      <Yasr
        result={result}
        prefixes={prefixes}
      />
    )
  }

  return null;
}
