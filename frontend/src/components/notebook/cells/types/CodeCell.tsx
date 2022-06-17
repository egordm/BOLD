import { StreamLanguage } from "@codemirror/language";
import { sparql } from "@codemirror/legacy-modes/mode/sparql";
import { Grid } from "@mui/material";
import CodeMirror from "@uiw/react-codemirror";
import { editorTheme } from "../../../../theme";
import { CodeCell as CodeCellData } from "../../structure";
import { useCellContext } from "../CellProvider";

export const CodeCell = (props: {}) => {
  const { cell, setCell } = useCellContext();
  const { source } = cell as CodeCellData;

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
