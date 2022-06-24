import { StreamLanguage } from "@codemirror/language";
import { sparql } from "@codemirror/legacy-modes/mode/sparql";
import { Grid } from "@mui/material";
import CodeMirror from "@uiw/react-codemirror";
import { useCellContext } from "../../../../providers/CellProvider";
import { editorTheme } from "../../../../theme";
import { CodeCell as CodeCellStructure } from "../../../../types/notebooks";

export const CodeCell = (props: {}) => {
  const { cell, setCell } = useCellContext();
  const { source } = cell as CodeCellStructure;

  const onChange = (value, viewUpdate) => {
    setCell({
      ...cell,
      source: value,
    })
  }

  return (
    <Grid item xs={12}>
      <CodeMirror
        value={source || ''}
        height="200px"
        extensions={[ StreamLanguage.define(sparql) ]}
        theme={editorTheme}
        onChange={onChange}
      />
    </Grid>
  );
}
