import { Box, Grid } from "@mui/material";
import { useMemo } from "react";
import { useCellContext } from "../../../providers/CellProvider";
import { OUTPUT_TYPES } from "./CellOutputTypes";

export const CellOutputContainer = (props: {
  cell_output_types?: Record<string, React.FC<any>>
}) => {
  const { outputs } = useCellContext();

  const cell_types = props.cell_output_types || OUTPUT_TYPES;

  const outputContent = /*useMemo(() =>*/ (outputs.map((output, i) => {
    const OutputComponent = cell_types[output.output_type as any];
    return <Box key={i} sx={{paddingY: 2}}>
      <OutputComponent  output={output}/>
    </Box>;
  }))/*, [ cell.outputs ]);*/

  console.log('outputs', outputs);

  return (outputs &&
      <Box>
        {outputContent}
      </Box>
  );
}
