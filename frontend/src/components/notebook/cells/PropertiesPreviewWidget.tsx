import {
  CardHeader, Container, Grid,
  IconButton
} from "@mui/material";
import { SELECT} from "@tpluscode/sparql-builder";
import React, { useMemo } from "react";
import { useCellWidgetData } from "../../../hooks/useCellWidgetData";
import { useCellContext } from "../../../providers/CellProvider";
import { usePrefixes, useReportContext } from "../../../providers/ReportProvider";
import { Cell, CellOutput, WidgetCellType } from "../../../types/notebooks";
import { Term } from "../../../types/terms";
import { termToSparql } from "../../../utils/sparql";
import { cellOutputToYasgui } from "../../../utils/yasgui";
import { SourceViewModal } from "../../data/SourceViewModal";
import { Yasr } from "../../data/Yasr";
import { NumberedSlider } from "../../input/NumberedSlider";
import CodeIcon from '@mui/icons-material/Code';
import { TermInput } from "../../input/TermInput";
import { CellOutputTabs } from "../outputs/CellOutputTabs";

interface PropertiesPreviewWidgetData {
  subject?: Term[];
  limit?: number;
  output_mode?: string;

}

const OUTPUT_TABS = [
  { value: 'table', label: 'Show Table' },
]


const buildQuery = (data: PropertiesPreviewWidgetData) => {

  const subject = data.subject?.map(termToSparql) ?? [];

  let primaryQuery = SELECT`?p ?o`.WHERE`
    VALUES ?s { ${subject} }
    ?s ?p ?o .
    FILTER(!isLiteral(?o) || langMatches(lang(?o), "en"))
  `.LIMIT(data.limit ?? 20);

  return {
    primaryQuery: primaryQuery.build(),
  };
}

export const PropertiesPreviewWidget = (props: {}) => {
  const { report } = useReportContext();
  const { cell } = useCellContext();
  const { data, source } = cell as WidgetCellType<PropertiesPreviewWidgetData>;
  const [ showSource, setShowSource ] = React.useState(false);
  const prefixes = usePrefixes();

  const { setData } = useCellWidgetData(buildQuery);

  const Content = useMemo(() => (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <CardHeader
            sx={{ p: 0 }}
            title="Property Preview Widget"
            subheader="Displays all properties for a given object"
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
            label="Subject must match"
            value={data.subject ?? []}
            onChange={(value) => setData({ subject: value })}
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
        </Grid>
      </Grid>
    </>
  ), [ data, prefixes ]);

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

  const result = cellOutputToYasgui(outputs[0]);
  return (
    <Yasr
      result={result}
      prefixes={prefixes}
    />
  )

  return null;
}
