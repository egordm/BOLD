import { Theme } from "@mui/system";
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import PropTypes from 'prop-types';
import { Box, Divider, Drawer, Typography, useMediaQuery } from '@mui/material';
import { Selector as SelectorIcon } from '../../icons/selector';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import ArticleIcon from '@mui/icons-material/Article';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import { NavItem } from './nav-item';

const items = [
  {
    href: '/', icon: (<WarehouseIcon fontSize="small"/>), title: 'Datasets'
  },
  {
    href: '/reports', icon: (<ArticleIcon fontSize="small"/>), title: 'Reports'
  },
  {
    href: '/tasks', icon: (<FormatListBulletedIcon fontSize="small"/>), title: 'Tasks'
  },
  // {
  //   href: '/datasets', icon: (<UsersIcon fontSize="small"/>), title: 'Datasets'
  // },
];

export const Sidebar = (props) => {
  const { open, onClose } = props;
  const router = useRouter();
  const lgUp = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'), {
    defaultMatches: true, noSsr: false
  });

  useEffect(() => {
      if (!router.isReady) {
        return;
      }

      if (open) {
        onClose?.();
      }
    }, // eslint-disable-next-line react-hooks/exhaustive-deps
    [ router.asPath ]);

  const content = (<>
    <Box
      sx={{
        display: 'flex', flexDirection: 'column', height: '100%'
      }}
    >
      <div>
        <Box sx={{
          mt: 3, px: 2
        }}>
          <Box
            sx={{
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              px: 3,
              py: '11px',
              borderRadius: 1
            }}
          >
            <div>
              <Typography
                color="inherit"
                variant="subtitle1"
              >
                Report 1
              </Typography>
              <Typography
                color="neutral.400"
                variant="body2"
              >
                Dataset: yago
              </Typography>
            </div>
            <SelectorIcon
              sx={{
                color: 'neutral.500', width: 14, height: 14
              }}
            />
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
