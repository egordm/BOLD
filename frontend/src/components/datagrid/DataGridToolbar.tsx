import { Box, Button, Card, CardContent, InputAdornment, SvgIcon, TextField, Typography } from "@mui/material";
import React from "react";
import UploadIcon from '@mui/icons-material/Upload';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';

export const DataGridToolbar = (props: {
  title: string;
  searchTitle?: string;
  onSearch?: (search: string) => void;
  addTitle?: string;
  onAdd?: () => void;
}) => {
  const {
    title,
    searchTitle = 'Search',
    onSearch,
    addTitle = 'Add',
    onAdd,
    ...rest
  } = props;

  return (
    <Box {...rest}>
      <Card>
        <CardContent>
          <Box
            sx={{
              alignItems: 'center',
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              m: -1
            }}
          >
            <Typography sx={{ m: 1 }} variant="h4">
              {title}
            </Typography>
            <Box sx={{ m: 1 }}>
              <Button
                startIcon={(<UploadIcon fontSize="small"/>)}
                sx={{ mr: 1 }}>
                Import
              </Button>
              <Button
                startIcon={(<DownloadIcon fontSize="small"/>)}
                sx={{ mr: 1 }}>
                Export
              </Button>
              {onAdd && (
                <Button
                  color="primary"
                  variant="contained"
                  onClick={onAdd}
                >
                  {addTitle}
                </Button>
              )}
            </Box>
          </Box>
          <Box sx={{ maxWidth: 500, mt: 3 }}>
            <TextField
              fullWidth
              onChange={(e) => {
                onSearch && onSearch(e.target.value);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SvgIcon
                      color="action"
                      fontSize="small"
                    >
                      <SearchIcon/>
                    </SvgIcon>
                  </InputAdornment>
                )
              }}
              placeholder={searchTitle}
              variant="outlined"
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
