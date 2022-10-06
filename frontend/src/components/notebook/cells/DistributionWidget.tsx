import {
  CardHeader, Grid,
  IconButton
} from "@mui/material";
import { SELECT } from "@tpluscode/sparql-builder";
import React, { useEffect, useMemo } from "react";
import { RuleGroupType } from "react-querybuilder";
import { useCellWidgetData } from "../../../hooks/useCellWidgetData";
import { useCellContext } from "../../../providers/CellProvider";
import { Cell, CellOutput, WidgetCellType } from "../../../types/notebooks";
import { PREFIXES } from "../../../utils/sparql";
import { SourceViewModal } from "../../data/SourceViewModal";
import CodeIcon from '@mui/icons-material/Code';
import QueryBuilder from "../../input/QueryBuilder";
import { CellOutputTabs } from "../outputs/CellOutputTabs";


interface DistributionData {
  tree: RuleGroupType,
  limit?: number;
  output_mode?: string;
}

const OUTPUT_TABS = [
  { value: 'sunburst', label: 'Sunburst' },
  { value: 'treemap', label: 'Treemap' },
  { value: 'tableHierarchy', label: 'Show Hierarchy Data' },
  { value: 'tableCounts', label: 'Show Counts Data' },
]

const buildQuery = (data: DistributionData) => {
  const { rdf, rdfs } = PREFIXES;

  const primaryQuery = SELECT`?type ?parent`
    .WHERE`
      ?type ${rdfs.subClassOf} ?parent .
    `.LIMIT(data.limit ?? 20);

  return {
    primaryQuery: primaryQuery.build(),
  };
}


export const DistributionWidget = (props: {}) => {
  const { cell } = useCellContext();
  const { data, source } = cell as WidgetCellType<DistributionData>;
  const [ showSource, setShowSource ] = React.useState(false);
  const { setData } = useCellWidgetData(buildQuery);

  useEffect(() => {
    setData({
      ...data,
    })
  }, []);

  const Content = useMemo(() => (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <CardHeader
            sx={{ p: 0 }}
            title="Distribution Widget"
            subheader="Description todo"
            action={
              <IconButton aria-label="View source" onClick={() => setShowSource(true)}>
                <CodeIcon/>
              </IconButton>
            }
          />
        </Grid>
        <Grid item xs={12}>
          <QueryBuilder
            value={data?.tree}
            setValue={(tree) => setData({ tree })}/>
        </Grid>
      </Grid>
    </>
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

  return null;
}
