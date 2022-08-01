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
import Datasets from "./pages/datasets";
import LODCPage from "./pages/lodc";
import NotebookPage from "./pages/report/[rid]";
import ReportsPage from "./pages/reports";
import TasksPage from "./pages/tasks";
import TriplyDBPage from "./pages/triplydb";
import { TasksProvider } from "./providers/TasksProvider";
import { createEmotionCache } from './utils/create-emotion-cache';
import { theme } from './theme';
import { Link, Route, Routes } from "react-router-dom";


const relativeTime = require('dayjs/plugin/relativeTime');
dayjs.extend(relativeTime)

const clientSideEmotionCache = createEmotionCache();

export default function App(props) {
  const queryClient = new QueryClient();

  return (
    <div className="App">
      <CacheProvider value={clientSideEmotionCache}>
        <QueryClientProvider client={queryClient}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <ThemeProvider theme={theme}>
              <TasksProvider>
                <SnackbarProvider maxSnack={3}>
                  <CssBaseline/>
                  <Routes>
                    <Route path="/" element={DatasetsPage.getLayout(<DatasetsPage />)} />
                    <Route path="/datasets" element={DatasetsPage.getLayout(<DatasetsPage />)} />
                    <Route path="/reports" element={ReportsPage.getLayout(<ReportsPage />)} />
                    <Route path="/report/:rid" element={NotebookPage.getLayout(<NotebookPage />)} />
                    <Route path="/tasks" element={TasksPage.getLayout(<TasksPage />)} />
                    <Route path="/lodc" element={LODCPage.getLayout(<LODCPage />)} />
                    <Route path="/triplydb" element={TriplyDBPage.getLayout(<TriplyDBPage />)} />
                  </Routes>
                  <TasksWidget/>
                </SnackbarProvider>
              </TasksProvider>
            </ThemeProvider>
          </LocalizationProvider>
        </QueryClientProvider>
      </CacheProvider>
    </div>
  );
}
