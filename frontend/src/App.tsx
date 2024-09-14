import dayjs from "dayjs";
import { CacheProvider } from '@emotion/react';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { SnackbarProvider } from "notistack";
import { QueryClient, QueryClientProvider } from "react-query";
import { TasksWidget } from "./containers/tasks/TasksWidget";
import DatasetsPage from "./pages/datasets";
import DataDiscoveryPage from "./pages/datadiscovery";
import LODCPage from "./pages/lodc";
import NotebookPage from "./pages/report/[rid]";
import ReportsPage from "./pages/reports";
import TasksPage from "./pages/tasks";
import TriplyDBPage from "./pages/triplydb";
import { AuthProvider } from "./providers/AuthProvider";
import { TasksProvider } from "./providers/TasksProvider";
import { createEmotionCache } from './utils/create-emotion-cache';
import { theme } from './theme';
import { Route, Routes, Navigate } from "react-router-dom";
import LoginPage from "./pages/login";


const relativeTime = require('dayjs/plugin/relativeTime');
dayjs.extend(relativeTime)

const clientSideEmotionCache = createEmotionCache();

export default function App(props) {
  const queryClient = new QueryClient();

  return (
    <div className="App">
      <CacheProvider value={clientSideEmotionCache}>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <ThemeProvider theme={theme}>
                <TasksProvider>
                  <SnackbarProvider maxSnack={3}>
                    <CssBaseline/>
                    <Routes>
                      <Route path="/" element={<Navigate replace to="/datasets"/>}/>
                      <Route path="/datasets" element={DatasetsPage.getLayout(<DatasetsPage/>)}/>
                      <Route path="/discovery" element={DatasetsPage.getLayout(<DataDiscoveryPage/>)}/>
                      <Route path="/reports" element={ReportsPage.getLayout(<ReportsPage/>)}/>
                      <Route path="/report/:rid" element={NotebookPage.getLayout(<NotebookPage/>)}/>
                      <Route path="/tasks" element={TasksPage.getLayout(<TasksPage/>)}/>
                      <Route path="/lodc" element={LODCPage.getLayout(<LODCPage/>)}/>
                      <Route path="/triplydb" element={TriplyDBPage.getLayout(<TriplyDBPage/>)}/>
                      <Route path="/login" element={LoginPage.getLayout(<LoginPage/>)}/>
                    </Routes>
                    <TasksWidget/>
                  </SnackbarProvider>
                </TasksProvider>
              </ThemeProvider>
            </LocalizationProvider>
          </QueryClientProvider>
        </AuthProvider>
      </CacheProvider>
    </div>
  );
}
