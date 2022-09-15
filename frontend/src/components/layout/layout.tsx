import { useState } from 'react';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import PrivateRoute from "../other/PrivateRoute";
import { Navbar } from './navbar';
import { Sidebar } from './sidebar';

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
  const [ isSidebarOpen, setSidebarOpen ] = useState(showSidebar);

  return (
    <PrivateRoute>
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
        {showNavbar && (<Navbar onSidebarOpen={() => setSidebarOpen(true)}/>)}
        <Sidebar
          onClose={() => setSidebarOpen(false)}
          open={isSidebarOpen}
        />
      </>
    </PrivateRoute>
  );
};
