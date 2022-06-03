import { useState } from 'react';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { DashboardNavbar } from './dashboard-navbar';
import { DashboardSidebar } from './dashboard-sidebar';

const LayoutRoot = styled('div')(({ theme }) => ({
  display: 'flex',
  flex: '1 1 auto',
  maxWidth: '100%',
  [theme.breakpoints.up('lg')]: {
    paddingLeft: 280
  }
}));

interface Props {
  children: React.ReactNode;
  showSidebar?: boolean;
  showNavbar?: boolean;
}

export const Layout = (props: Props) => {
  const {
    children,
    showSidebar = true,
    showNavbar = true
  } = props;
  const [isSidebarOpen, setSidebarOpen] = useState(showSidebar);

  return (
    <>
      <LayoutRoot sx={{
        paddingTop: showNavbar ? '64px' : 0,
      }}>
        <Box
          sx={{
            display: 'flex',
            flex: '1 1 auto',
            flexDirection: 'column',
            width: '100%'
          }}
        >
          {children}
        </Box>
      </LayoutRoot>
      {showNavbar && (<DashboardNavbar onSidebarOpen={() => setSidebarOpen(true)} />)}
      <DashboardSidebar
        onClose={() => setSidebarOpen(false)}
        open={isSidebarOpen}
      />
    </>
  );
};
