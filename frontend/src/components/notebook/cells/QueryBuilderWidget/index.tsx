import CodeIcon from "@mui/icons-material/Code";
import { CardHeader, Container, Grid, IconButton } from "@mui/material";
import React, { useEffect, useMemo } from "react";
import { useCellWidgetData } from "../../../../hooks/useCellWidgetData";
import { useCellContext } from "../../../../providers/CellProvider";
import { WidgetCellType } from "../../../../types/notebooks";
import { SourceViewModal } from "../../../data/SourceViewModal";
import { NumberedSlider } from "../../../input/NumberedSlider";
import QueryBuilder from "../../../input/QueryBuilder";
import { collectVarsFromGroup } from "../../../input/QueryBuilder/utils";
import { OptionType, VariableInput } from "../../../input/VariableInput";
import { CellOutputTabs } from "../../outputs/CellOutputTabs";
import { buildQuery } from "./query";
import { ResultTab } from "./ResultTab";
import { QueryBuilderData } from "./types";

const MAX_RESULTS = 1000;

const OUTPUT_TABS = [
  { value: 'table', label: 'Table' },
]

export const QueryBuilderWidget = (props: {}) => {
  const { cell } = useCellContext();
  const { data, source } = cell as WidgetCellType<QueryBuilderData>;
  const [ showSource, setShowSource ] = React.useState(false);
  const { setData } = useCellWidgetData(buildQuery);

  useEffect(() => {
    setData({
      select: [
        { value: 'main', label: 'main' }
      ],
      ...data,
    })
  }, []);

  const variables = useMemo(() => collectVarsFromGroup(data.tree), [ data.tree ]);

  const queryBuilder = useMemo(() => (
    <QueryBuilder
      value={data?.tree}
      setValue={(tree) => setData({ tree })}/>
  ), [ data?.tree ]);

  const Content = useMemo(() => (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <CardHeader
            sx={{ p: 0 }}
            title="Query Builder Widget"
            subheader="Build sparql queries in a visual way"
            action={
              <IconButton aria-label="View source" onClick={() => setShowSource(true)}>
                <CodeIcon/>
              </IconButton>
            }
          />
        </Grid>
        <Grid item xs={12}>
          <VariableInput
            options={variables as any}
            label="Select variables"
            allowAny={false}
            selectOnly={true}
            multiple={true}
            value={data.select as any}
            onChange={(select: OptionType[]) => setData({ select })}
            defaultValue={[ { label: 'main', value: 'main' } ]}
          />
        </Grid>
        <Grid item xs={12}>
          {queryBuilder}
        </Grid>
        <Grid item xs={12}>
          <Container maxWidth="md">
            <NumberedSlider
              label={'Limit number of results'}
              value={data?.limit ?? 20}
              valueLabelFormat={(value) => value !== MAX_RESULTS ? value.toString() : 'Unlimited'}
              onChange={(event, limit: number) => setData({ limit })}
              min={1} max={MAX_RESULTS} step={Math.ceil((MAX_RESULTS / 20))}
            />
          </Container>
        </Grid>
      </Grid>
    </>
  ), [ data, data.select ]);

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
          'Primary Query': source[0],
        }}
        open={showSource}
        onClose={() => setShowSource(false)}
      />
    </>
  )
}
