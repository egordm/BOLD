import {
  Box,
  Grid
} from "@mui/material";
import React, { useMemo } from "react";
import { useCellContext } from "../../../../providers/CellProvider";
import { usePrefixes } from "../../../../providers/DatasetProvider";
import { CodeCellType } from "../../../../types/notebooks";
import { cellOutputToYasgui } from "../../../../utils/yasgui";
import { Yasr } from "../../../data/Yasr";
import { Yasqe } from "../../../input/Yasqe";
import { GPTModal } from "./GPTModal";


export const CodeWidget = () => {
  const { cell, cellRef, outputs, setCell } = useCellContext();
  const { source } = cell as CodeCellType;
  const editorRef = React.useRef(null);
  const prefixes = usePrefixes();

  const content = useMemo(() => (
    <Grid item xs={12}>
      <Yasqe
        value={source || ''}
        onChange={(value) => {
          setCell({
            ...cellRef.current,
            source: value,
          } as any)
        }}
        editorRef={editorRef}
        prefixes={prefixes}
      />
    </Grid>
  ), [ source, prefixes ]);

  const result = useMemo(() => {
    if (!!outputs?.length) {
      return (<Box sx={{ width: '100%' }}>
        <Yasr
          result={cellOutputToYasgui(outputs[0])}
          prefixes={prefixes}
        />
      </Box>)
    }

    return null;
  }, [ outputs, prefixes ]);

  const modal = useMemo(() => (
    <GPTModal
      setSource={(source) => editorRef.current?.setValue(source)}
    />
  ), []);

  return (
    <>
      {content}
      {modal}
      {result}
    </>
  )
}
