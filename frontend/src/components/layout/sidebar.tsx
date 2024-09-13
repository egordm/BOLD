import { styled } from "@mui/material/styles";
import { Theme } from "@mui/system";
import PropTypes from 'prop-types';
import { Avatar, Box, Divider, Drawer, IconButton, Link, Paper, Stack, Typography, useMediaQuery } from '@mui/material';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import SearchIcon from '@mui/icons-material/Search';
import ArticleIcon from '@mui/icons-material/Article';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import CloudIcon from '@mui/icons-material/Cloud';
import { useAuthContext } from "../../providers/AuthProvider";
import { Logo } from "../other/Logo";
import { NavItem } from './nav-item';
import StorageIcon from '@mui/icons-material/Storage';
import LogoutIcon from '@mui/icons-material/Logout';
import SchoolIcon from '@mui/icons-material/School';
import GitHubIcon from '@mui/icons-material/GitHub';

const items = [
  {
    href: '/datasets', icon: (<WarehouseIcon fontSize="small"/>), title: 'Datasets'
  },
  {
    href: '/discovery', icon: (<SearchIcon fontSize="small"/>), title: 'Discovery'
  },
  {
    href: '/reports', icon: (<ArticleIcon fontSize="small"/>), title: 'Reports'
  },
  {
    href: '/tasks', icon: (<FormatListBulletedIcon fontSize="small"/>), title: 'Tasks'
  },
  {
    href: '/lodc', icon: (<CloudIcon fontSize="small"/>), title: 'LODC'
  },
  {
    href: '/triplydb', icon: (<StorageIcon fontSize="small"/>), title: 'TriplyDB'
  },
];

const bottomItems = [
  {
    href: 'https://egordm.github.io/BOLD/', icon: (<SchoolIcon fontSize="small"/>), title: 'Documentation',
    external: true,
  },
  {
    href: 'https://github.com/EgorDm/BOLD', icon: (<GitHubIcon fontSize="small"/>), title: 'Source Code',
    external: true,
  },
]

export const Sidebar = (props) => {
  const { open, onClose } = props;
  const lgUp = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'), {
    defaultMatches: true, noSsr: false
  });

  const { user, logoutUser } = useAuthContext();
  // console.log(user);

  const content = (<>
    <Box
      sx={{
        display: 'flex', flexDirection: 'column', height: '100%'
      }}
    >
      <div>
        <Stack alignItems={"center"} sx={{ mt: 3, mb: 2, px: 2 }}>
          <Logo/>
        </Stack>

        <Box sx={{ px: 2 }}>
          <Box
            sx={{
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              pl: 2,
              pr: 1,
              borderRadius: 1,
              py: 1,
            }}
          >
            <div>
              <Typography color="inherit" variant="subtitle1">
                {user?.name ?? user?.username}
              </Typography>
              <Typography color="neutral.400" variant="body2">
                {user?.group}
              </Typography>
            </div>
            <IconButton aria-label="logout" size="medium" onClick={logoutUser}>
              <LogoutIcon fontSize="inherit"/>
            </IconButton>
          </Box>
        </Box>
      </div>

      <Divider
        sx={{
          borderColor: '#2D3748', my: 3
        }}
      />
      <Box sx={{ flexGrow: 1 }}>
        {items.map((item) => (<NavItem
          key={item.title}
          icon={item.icon}
          href={item.href}
          title={item.title}
          external={false}
        />))}
      </Box>
      <Box sx={{ flex: 1 }}/>
      <Box sx={{ pb: 2 }}>
        {bottomItems.map((item) => (<NavItem
          key={item.title}
          icon={item.icon}
          href={item.href}
          title={item.title}
          external={item?.external ?? false}
        />))}
      </Box>
    </Box>
  </>);

  if (lgUp) {
    return (<Drawer
      anchor="left"
      open
      PaperProps={{
        sx: {
          backgroundColor: 'neutral.900', color: '#FFFFFF', width: 280
        }
      }}
      variant="permanent"
    >
      {content}
    </Drawer>);
  }

  return (<Drawer
    anchor="left"
    onClose={onClose}
    open={open}
    PaperProps={{
      sx: {
        backgroundColor: 'neutral.900', color: '#FFFFFF', width: 280
      }
    }}
    sx={{ zIndex: (theme) => theme.zIndex.appBar + 100 }}
    variant="temporary"
  >
    {content}
  </Drawer>);
};

Sidebar.propTypes = {
  onClose: PropTypes.func, open: PropTypes.bool
};
