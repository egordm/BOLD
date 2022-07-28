import { Card, CardContent, CardHeader, Modal} from "@mui/material";
import React from "react";


export const ModalContainer = (props: {
  open: boolean;
  onClose: () => void;
  title: string;
  header?: React.ReactNode;
  children?: React.ReactNode;
}) => {
  const { open, onClose, title, header, children } = props;

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Card sx={{
        width: 600,
        position: 'absolute' as 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {header ? header : <CardHeader title={title}/>}
        <CardContent sx={{ overflow: 'auto', flex: 1 }}>
          {children}
        </CardContent>
      </Card>
    </Modal>
  )
}
