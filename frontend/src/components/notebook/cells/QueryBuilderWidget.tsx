import {
  CardHeader, Container, Grid,
  IconButton
} from "@mui/material";
import { variable } from "@rdfjs/data-model";
import { SELECT } from "@tpluscode/sparql-builder";
import React, { useEffect, useMemo } from "react";
import { RuleGroupType } from "react-querybuilder";
import { useCellWidgetData } from "../../../hooks/useCellWidgetData";
import { useCellContext } from "../../../providers/CellProvider";
import { usePrefixes } from "../../../providers/ReportProvider";
import { Cell, CellOutput, WidgetCellType } from "../../../types/notebooks";
import { sparqlLabelsBound } from "../../../utils/sparql";
import { cellOutputToYasgui } from "../../../utils/yasgui";
import { SourceViewModal } from "../../data/SourceViewModal";
import CodeIcon from '@mui/icons-material/Code';
import { Yasr } from "../../data/Yasr";
import { NumberedSlider } from "../../input/NumberedSlider";
import QueryBuilder from "../../input/QueryBuilder";
import { queryToSparql } from "../../input/QueryBuilder/sparql";
import { collectVarsFromGroup } from "../../input/QueryBuilder/utils";
import { OptionType, VariableInput } from "../../input/VariableInput";
import { CellOutputTabs } from "../outputs/CellOutputTabs";

const MAX_RESULTS = 1000;

interface DistributionData {
  tree: RuleGroupType,
  select: OptionType[],
  limit?: number;
  output_mode?: string;
}

const OUTPUT_TABS = [
  { value: 'table', label: 'Table' },
]

const buildQuery = (data: DistributionData) => {
  const vars = (data.select ?? []).map(v => variable(v.value));
  if (!vars.length) {
    return {};
    // throw new Error('No variables selected');
  }

  const { bounds: labelBounds, vars: labelVars} = sparqlLabelsBound(vars);
  const selectVars = [...vars, ...labelVars];

  const body = queryToSparql(data.tree);
  const query = SELECT`${selectVars}`
    .WHERE`
      ${body}
      ${labelBounds}
    `
    .LIMIT(data.limit ?? 20);

  return {
    primaryQuery: query.build(),
  };
}


export const QueryBuilderWidget = (props: {}) => {
  const { cell } = useCellContext();
  const { data, source } = cell as WidgetCellType<DistributionData>;
  const [ showSource, setShowSource ] = React.useState(false);
  const { setData } = useCellWidgetData(buildQuery);

  useEffect(() => {
    setData({
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

const ResultTab = ({
  mode, cell, outputs
}: {
  mode: string,
  cell: Cell,
  outputs: CellOutput[] | null,
}) => {
  const prefixes = usePrefixes();
  const result = cellOutputToYasgui(outputs[0]);

  return (
    <Yasr
      result={result}
      prefixes={prefixes}
    />
  )
}
