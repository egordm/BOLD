import { Box} from "@mui/material";
import { CellExecuteOutput as CellExecuteOutputStructure } from "../../../../types/notebooks";
import { Yasr } from "../../../data/Yasr";

export const CellExecuteResultOutput = (props: {
  output: CellExecuteOutputStructure
}) => {
  const { output, ...rest } = props;

  return (
    <Box {...rest} sx={{ height: 400, width: '100%' }}>
      <Yasr
        result={{
          data: output.data['application/sparql-results+json'],
          contentType: 'application/sparql-results+json',
          status: 200,
          executionTime: 0,
        }}
      />
    </Box>
  );
}
