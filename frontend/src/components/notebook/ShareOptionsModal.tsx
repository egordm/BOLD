import {
  Avatar, Button,
  FormControl,
  InputLabel, lighten,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Select, Stack, Typography
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import React, { useCallback, useEffect } from "react";
import { useApi } from "../../hooks/useApi";
import useNotification from "../../hooks/useNotification";
import { useReportContext } from "../../providers/ReportProvider";
import { ModalContainer } from "../layout/ModalContainer";
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LinkIcon from '@mui/icons-material/Link';
import PublicIcon from '@mui/icons-material/Public';

type DiscoveryMode = 'PRIVATE' | 'UNLISTED' | 'PUBLIC';
type AccessMode = 'VIEW' | 'EDIT';

const useStyles = makeStyles({
  customSelect: {
    borderRadius: 2,
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 2,
    marginLeft: -8,
    marginBottom: -2,
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.12)',
      // backgroundColor: '#DDD',
    },
  }
})

export const ShareOptionsModal = ({
  open,
  onClose,
}: {
  open: boolean,
  onClose: () => void,
}) => {
  const classes = useStyles()
  const [ mode, setMode ] = React.useState<DiscoveryMode>('PRIVATE');
  const [ access, setAccess ] = React.useState<AccessMode>('VIEW');

  const { reportRef, save } = useReportContext();

  useEffect(() => {
    if (open) {
      if (reportRef.current?.discoverable) {
        setMode('PUBLIC');
        setAccess(reportRef.current?.share_mode === 'PUBLIC_READWRITE' ? 'EDIT' : 'VIEW');
      } else {
        if (reportRef.current?.share_mode === 'PRIVATE') {
          setMode('PRIVATE');
          setAccess('VIEW');
        } else {
          setMode('UNLISTED');
          setAccess(reportRef.current?.share_mode === 'PUBLIC_READWRITE' ? 'EDIT' : 'VIEW');
        }
      }
    }
  }, [ open ]);

  const submit = () => {
    save({
      ...reportRef.current,
      discoverable: mode === 'PUBLIC',
      share_mode: (mode === 'PUBLIC' || mode === 'UNLISTED')
        ? (access === 'EDIT' ? 'PUBLIC_READWRITE' : 'PUBLIC_READONLY')
        : 'PRIVATE',
    });
    onClose();
  };

  const Icon = mode === 'PRIVATE'
    ? LockOutlinedIcon
    : mode === 'UNLISTED'
      ? LinkIcon
      : PublicIcon;

  const actionColor = mode === 'PRIVATE'
    ? 'neutral.400'
    : mode === 'UNLISTED'
      ? 'warning.light'
      : 'success.light';

  const caption = mode === 'PRIVATE'
    ? 'Only you can see this notebook'
    : mode === 'UNLISTED'
      ? 'Anyone with the link can see this notebook'
      : 'Anyone can see this notebook';

  return (
    <ModalContainer
      width={500}
      title={'Sharing Options'}
      open={open}
      onClose={onClose}>
      <ListItem
        sx={{
          backgroundColor: lighten('#64B6F7', 0.8),
          borderRadius: 2,
        }}
        secondaryAction={
          mode !== 'PRIVATE' ? (
            <FormControl sx={{ maxWidth: 80 }} size="small">
              <Select
                className={classes.customSelect}
                sx={{ pt: 0.5, pb: 0.5 }}
                disableUnderline={true}
                variant={'standard'}
                value={access}
                onChange={(e) => setAccess(e.target.value as AccessMode)}
              >
                <MenuItem value="VIEW">View</MenuItem>
                <MenuItem value="EDIT">Edit</MenuItem>
              </Select>
            </FormControl>
          ) : null
        }
      >
        <ListItemAvatar>
          <Avatar sx={{ bgcolor: '#FFFFFF', color: actionColor }}>
            <Icon sx={{ color: actionColor }}/>
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          sx={{ pr: 5.5 }}
          primary={
            <FormControl sx={{ minWidth: 120 }} size="small">
              <Select
                className={classes.customSelect}
                disableUnderline={true}
                variant={'standard'}
                value={mode}
                onChange={(e) => setMode(e.target.value as DiscoveryMode)}
              >
                <MenuItem value="PRIVATE">Restricted</MenuItem>
                <MenuItem value="UNLISTED">Anyone with the link</MenuItem>
                <MenuItem value="PUBLIC">Public</MenuItem>
              </Select>
            </FormControl>
          }
          secondary={<Typography variant={"caption"} color={'text.secondary'}>
            {caption}
          </Typography>}
        />
      </ListItem>
      <Stack direction={'row'} alignContent="end" justifyContent={"end"} sx={{ mt: 3 }}>
        <Button variant="contained" onClick={submit}>Save</Button>
      </Stack>
    </ModalContainer>
  )
}
