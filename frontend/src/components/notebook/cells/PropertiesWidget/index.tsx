import CodeIcon from "@mui/icons-material/Code";
import { CardHeader, Container, Grid, IconButton } from "@mui/material";
import React, { useMemo } from "react";
import { useCellWidgetData } from "../../../../hooks/useCellWidgetData";
import { useCellContext } from "../../../../providers/CellProvider";
import { useDatasetContext, usePrefixes } from "../../../../providers/DatasetProvider";
import { WidgetCellType } from "../../../../types/notebooks";
import { SourceViewModal } from "../../../data/SourceViewModal";
import { FlexibleTermInput } from "../../../input/FlexibleTermInput";
import { NumberedSlider } from "../../../input/NumberedSlider";
import { QueryContext } from "../../../input/QueryBuilder/config";
import { CellOutputTabs } from "../../outputs/CellOutputTabs";
import { buildQuery } from "./query";
import { ResultTab } from "./ResultTab";
import { PropertiesWidgetData } from "./types";


const OUTPUT_TABS = [
  { value: 'properties', label: 'Properties' },
  { value: 'table', label: 'Show Table' },
]

export const PropertiesWidget = () => {
  const { dataset } = useDatasetContext();
  const { cell } = useCellContext();
  const { data, source } = cell as WidgetCellType<PropertiesWidgetData>;
  const [ showSource, setShowSource ] = React.useState(false);
  const prefixes = usePrefixes();

  const context: Partial<QueryContext> = {
    prefixes,
    datasetId: dataset?.id,
  };

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
              <IconButton sx={{ mr: 3 }} onClick={() => setShowSource(true)}>
                <CodeIcon/>
              </IconButton>
            }
          />
        </Grid>
        <Grid item xs={12}>
          <FlexibleTermInput
            pos={'SUBJECT'}
            label="Subject must match"
            value={data.subject}
            onChange={(subject) => setData({ ...data, subject })}
            context={context}
            allowAny={false}
            allowVars={false}
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
