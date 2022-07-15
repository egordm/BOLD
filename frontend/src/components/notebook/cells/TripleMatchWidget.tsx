import {
  Button,
  CardHeader, Checkbox, Container, FormControl, FormControlLabel, FormGroup,
  Grid,
  IconButton, InputLabel, MenuItem,
  Stack, Switch,
  TextField,
  Select, Typography
} from "@mui/material";
import { literal, namedNode, variable } from "@rdfjs/data-model";
import { SELECT, sparql } from "@tpluscode/sparql-builder";
import { WhereBuilder } from "@tpluscode/sparql-builder/lib/partials/WHERE";
import React, { useCallback, useEffect, useMemo } from "react";
import { useCellContext } from "../../../providers/CellProvider";
import { usePrefixes, useReportContext } from "../../../providers/ReportProvider";
import { CellOutput, WidgetCellType } from "../../../types/notebooks";
import { Term } from "../../../types/terms";
import { cellOutputToYasgui } from "../../../utils/yasgui";
import { SourceViewModal } from "../../data/SourceViewModal";
import { Yasr } from "../../data/Yasr";
import { NumberedSlider } from "../../input/NumberedSlider";
import { TermInput } from "../../input/TermInput";
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CodeIcon from '@mui/icons-material/Code';
import { VirtualizedTabs } from "../../layout/VirtualizedTabs";

interface TripleMatchWidgetData {
  target?: 'SUBJECT' | 'PREDICATE' | 'OBJECT';
  subject?: Term[];
  predicate?: Term[];
  object?: Term[];
  limit?: number;
  output_mode?: 'table';
  visualization_settings?: {}
}

const OUTPUT_TABS = [
  { value: 'table', label: 'Show Table' },
]

const termToSparql = (term: Term) => {
  if (term.type === 'literal') {
    return literal(term.value, term.lang ?? undefined);
  } else {
    return namedNode(term.value);
  }
}


const buildQuery = (data: TripleMatchWidgetData) => {

  let query = SELECT`?s ?p ?o` as any;
  const target = data.target ?? 'SUBJECT';

  let subjectVar = variable('s');
  let predicateVar = variable('p');
  let objectVar = variable('o');

  if (target !== 'SUBJECT' && data.subject?.length) {
    const subject = data.subject?.map(termToSparql) ?? [];
    query = query.WHERE`VALUES ${subjectVar} { ${subject} }`
  }

  if (target !== 'PREDICATE' && data.predicate?.length) {
    const predicate = data.predicate?.map(termToSparql) ?? [];
    query = query.WHERE`VALUES ${predicateVar} { ${predicate} }`
  }

  if (target !== 'OBJECT' && data.object?.length) {
    const object = data.object?.map(termToSparql) ?? [];
    query = query.WHERE`VALUES ${objectVar} { ${object} }`
  }

  query = query.WHERE`
    ${subjectVar} ${predicateVar} ${objectVar}
  `.LIMIT(data.limit ?? 100);

  return {
    primaryQuery: query.build(),
  };
}

export const TripleMatchWidget = (props: {}) => {
  const { report } = useReportContext();
  const { cell, cellRef, outputs, setCell } = useCellContext();
  const { data, source } = cell as WidgetCellType<TripleMatchWidgetData>;
  const [ showSource, setShowSource ] = React.useState(false);

  useEffect(() => {
    const { primaryQuery } = buildQuery(data);

    setCell({
      ...cell,
      source: [
        primaryQuery,
      ],
    } as any)
  }, [ data ]);

  const setData = useCallback((newData: Partial<TripleMatchWidgetData>) => {
    const cell = cellRef.current as WidgetCellType<TripleMatchWidgetData>;

    setCell({
      ...cell,
      data: { ...cell.data, ...newData }
    } as any)
  }, [])

  const target = data.target ?? 'SUBJECT';

  const Content = useMemo(() => (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <CardHeader
            sx={{ p: 0 }}
            title="Triple Match Builder"
            subheader="Displays all matching triples given a set of filters"
            action={
              <IconButton aria-label="View source" onClick={() => setShowSource(true)}>
                <CodeIcon/>
              </IconButton>
            }
          />
        </Grid>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>I need a</InputLabel>
            <Select
              value={target}
              label="Term Type"
              onChange={(event) => setData({ target: event.target.value as any })}
            >
              <MenuItem value="SUBJECT">Subject</MenuItem>
              <MenuItem value="PREDICATE">Predicate</MenuItem>
              <MenuItem value="OBJECT">Object</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <Typography>That matches</Typography>
        </Grid>
        <Grid container item xs={12}>
          <Grid item xs={4}>
            {target === 'SUBJECT' ? (
              <TextField label="For Subject" value="Any" variant="filled" fullWidth disabled={true}/>
            ) : (
              <TermInput
                datasetId={report?.dataset?.id}
                pos={'SUBJECT'}
                label="Subject must match"
                value={data.subject ?? []}
                onChange={(value) => setData({ subject: value })}
              />
            )}
          </Grid>
          <Grid item xs={4}>
            {target === 'PREDICATE' ? (
              <TextField label="For Predicate" value="Any" variant="filled" fullWidth disabled={true}/>
            ) : (
              <TermInput
                datasetId={report?.dataset?.id}
                pos={'PREDICATE'}
                label="Predicate must match"
                value={data.predicate ?? []}
                onChange={(value) => setData({ predicate: value })}
              />
            )}
          </Grid>
          <Grid item xs={4}>
            <Stack direction="row" spacing={2}>
              {target === 'OBJECT' ? (
                <TextField label="For Object" value="Any" variant="filled" fullWidth disabled={true}/>

              ) : (
                <TermInput
                  sx={{ flex: 1 }}
                  datasetId={report?.dataset?.id}
                  pos={'OBJECT'}
                  label="Object must match"
                  value={data.object ?? []}
                  onChange={(value) => setData({ object: value })}
                />
              )}
            </Stack>
          </Grid>
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

  const Result = useMemo(() => !!outputs?.length && (
    <VirtualizedTabs
      value={data.output_mode ?? 'table'}
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
  settings: {},
  setData: (data: Partial<TripleMatchWidgetData>) => void,
}) => {
  const prefixes = usePrefixes();

  if (mode === 'table') {
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
