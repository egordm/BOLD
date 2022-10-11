import {
  CardHeader, Container, Grid,
  IconButton
} from "@mui/material";
import React, { useMemo } from "react";
import { useCellWidgetData } from "../../../../hooks/useCellWidgetData";
import { useCellContext } from "../../../../providers/CellProvider";
import { useDatasetContext, usePrefixes } from "../../../../providers/DatasetProvider";
import { WidgetCellType } from "../../../../types/notebooks";
import { SourceViewModal } from "../../../data/SourceViewModal";
import { Checkbox } from "../../../input/Checkbox";
import { FlexibleTermInput } from "../../../input/FlexibleTermInput";
import { NumberedSlider } from "../../../input/NumberedSlider";
import { QueryContext } from "../../../input/QueryBuilder/config";
import { CellOutputTabs } from "../../outputs/CellOutputTabs";
import { buildQuery } from "./query";
import { ResultTab } from "./ResultTab";
import { SubgraphWidgetData } from "./types";
import CodeIcon from '@mui/icons-material/Code';


const OUTPUT_TABS = [
  { value: 'graph', label: 'Graph' },
  { value: 'table', label: 'Show Table' },
]


export const SubgraphWidget = () => {
  const { dataset } = useDatasetContext();
  const { cell } = useCellContext();
  const { data, source } = cell as WidgetCellType<SubgraphWidgetData>;
  const [ showSource, setShowSource ] = React.useState(false);
  const { setData } = useCellWidgetData(buildQuery);
  const prefixes = usePrefixes();

  const context: Partial<QueryContext> = {
    prefixes,
    datasetId: dataset?.id,
  };

  const anyPredicate = data.anyPredicate ?? true;

  const Content = useMemo(() => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <CardHeader
          sx={{ p: 0 }}
          title="Subgraph Widget"
          subheader="Displays a subgraph consisting os triples around a chosen entity."
          action={
            <IconButton sx={{ mr: 3 }} onClick={() => setShowSource(true)}>
              <CodeIcon/>
            </IconButton>
          }
        />
      </Grid>
      <Grid item xs={12}>
        <FlexibleTermInput
          pos={'SUBJECT'}
          label="Create subgraph for"
          value={data.entity}
          onChange={(entity) => setData({ ...data, entity })}
          context={context}
          allowAny={false}
          allowVars={false}
        />
      </Grid>
      <Grid item xs={2}>
        <Checkbox
          value={anyPredicate}
          onChange={(e) => setData({ anyPredicate: e.target.checked })}
          label="Use any property"/>
      </Grid>
      <Grid item xs={10}>
        <FlexibleTermInput
          pos={'PREDICATE'}
          label="Limit properties to"
          value={data.predicates}
          onChange={(predicates) => setData({ ...data, predicates })}
          context={context}
          allowAny={false}
          allowVars={false}
          disabled={anyPredicate}
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
          'Query': source[0],
        }}
        open={showSource}
        onClose={() => setShowSource(false)}
      />
    </>
  )
}
