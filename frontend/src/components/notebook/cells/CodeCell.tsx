import { Box, Grid } from "@mui/material";
import React, { useMemo } from "react";
import { useCellContext } from "../../../providers/CellProvider";
import { usePrefixes, useReportContext } from "../../../providers/ReportProvider";
import { namespacesToPrefixes } from "../../../types/datasets";
import { CodeCellType } from "../../../types/notebooks";
import { cellOutputToYasgui } from "../../../utils/yasgui";
import { Yasr } from "../../data/Yasr";
import { Yasqe } from "../../input/Yasqe";

export const CodeCell = (props: {}) => {
  const { cell, outputs, setCell } = useCellContext();
  const { source } = cell as CodeCellType;
  const editorRef = React.useRef(null);
  const prefixes = usePrefixes();

  const onChange = (value) => {
    setCell({
      ...cell,
      source: value,
    })
  }

  const Content = (
    <Grid item xs={12}>
      <Yasqe
        value={source || ''}
        onChange={onChange}
        editorRef={editorRef}
      />
    </Grid>
  )

  const result = React.useMemo(() => {
    if (!outputs?.length) {
      return null;
    }

    return cellOutputToYasgui(outputs[0]);
  }, [ outputs ]);

  const Result = useMemo(() => !!outputs?.length && (
    <Box sx={{ width: '100%' }}>
      <Yasr
        result={result}
        prefixes={prefixes}
      />
    </Box>
  ), [ outputs, prefixes ]);

  return (
    <>
      {Content}
      {Result}
    </>
  )
}
