import { Box, Stack, Typography } from "@mui/material";
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';


export const Logo = (props: {}) => (
  <Stack direction="row">
    <Typography variant="h3" fontWeight={'bold'}>
      BOLD
    </Typography>
    {/*<MoreHorizIcon/>*/}
    <MoreHorizIcon sx={{
      transform: 'rotate(90deg)',
      fontSize: 44,
      marginTop: 0.25,
      marginLeft: -1.1,
      marginRight: -1.5,
    }}/>
  </Stack>
)
