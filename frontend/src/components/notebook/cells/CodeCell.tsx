import { Box, Grid } from "@mui/material";
import React, { useEffect } from "react";
import { useCellContext } from "../../../providers/CellProvider";
import { useReportContext } from "../../../providers/ReportProvider";
import { CodeCellType } from "../../../types/notebooks";
import { Yasr } from "../../data/Yasr";
import { Yasqe } from "../../input/Yasqe";

export const CodeCell = (props: {}) => {
  const { report } = useReportContext();
  const { cell, outputs, setCell } = useCellContext();
  const { source } = cell as CodeCellType;
  const editorRef = React.useRef(null);

  const prefixes = React.useMemo(() => {
    const namespaces = report?.dataset?.namespaces ?? [];

    return {
      ...Object.fromEntries(namespaces.map(({ prefix, name }) => [ prefix, name ])),
    }
  }, [ report?.dataset?.namespaces ]);

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

    const output = outputs[0];
    if (output.output_type === 'execute_result') {
      const contentType = Object.keys(output.data)[0];
      const data = output.data[contentType];

      return {
        data, contentType,
        status: 200,
        executionTime: output.execution_time ?? 0,
      }
    } else if (output.output_type === 'error') {
      const error = [
        output.ename,
        output.evalue,
        output.traceback.join('\n'),
      ]

      return {
        status: 400,
        executionTime: output.execution_time ?? 0,
        error: {
          status: 400,
          text: error.join('\n\n'),
        }
      }
    } else {
      return {
        status: 400,
        executionTime: output.execution_time ?? 0,
        error: {
          status: 400,
          text: `Cant render output`,
        }
      }
    }
  }, [ outputs ]);

  const Result = outputs?.length && (
    <Box sx={{ height: 400, width: '100%' }}>
      <Yasr
        result={result}
        prefixes={prefixes}
      />
    </Box>
  )

  return (
    <>
      {Content}
      {Result}
    </>
  )
}
