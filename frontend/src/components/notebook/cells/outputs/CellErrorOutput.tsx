import { Box, Typography } from "@mui/material";
import { CellErrorOutput as CellErrorOutputStructure } from "../../../../types/notebooks";

export const CellErrorOutput = (props: {
  output: CellErrorOutputStructure
}) => {
  const { output, ...rest } = props;

  return (
    <Box {...rest}>
      <Box sx={{ fontFamily: 'Monospace' }}>
        {output.evalue}
      </Box>
    </Box>
  );
}
