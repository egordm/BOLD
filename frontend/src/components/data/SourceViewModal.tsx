import { Divider, Modal, Stack, Typography } from "@mui/material";
import { Box } from "@mui/system";
import React from "react";

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 700,
  maxWidth: '100%',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  maxHeight: '100%',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: 'Monospace',
  overflow: 'auto',
};


export const SourceViewModal = (props: {
  source: Record<string, string>;
  open: boolean;
  onClose: () => void;
}) => {
  const { source, open, onClose } = props;

  return (
    <Modal
      open={open}
      onClose={onClose}
    >
      <Box sx={style}>
        <Stack spacing={2}>
          {(Object.entries(source) ?? []).filter(([_, s]) => s).map(([ title, s ], index) => (
            <Box key={index}>
              <Divider/>
              <Typography variant="h6">{title}</Typography>
              <pre style={{ fontFamily: 'inherit' }}>
                {s.replaceAll('\n\n', '\n')}
              </pre>
            </Box>
          ))}
        </Stack>
      </Box>
    </Modal>
  )
}
