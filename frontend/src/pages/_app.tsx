import dayjs from "dayjs";
import Head from 'next/head';
import { CacheProvider } from '@emotion/react';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { SnackbarProvider } from "notistack";
import { QueryClient, QueryClientProvider } from "react-query";
import { TasksWidget } from "../containers/tasks/TasksWidget";
import { TasksProvider } from "../providers/TasksProvider";
import { createEmotionCache } from '../utils/create-emotion-cache';
import { theme } from '../theme';
import NProgress from "nprogress";
import Router from "next/router";

Router.events.on('routeChangeStart', url => {
  NProgress.start()
})

Router.events.on('routeChangeComplete', url => {
  NProgress.done()
})

Router.events.on('routeChangeError', url => {
  NProgress.done()
})


const relativeTime = require('dayjs/plugin/relativeTime');
dayjs.extend(relativeTime)

const clientSideEmotionCache = createEmotionCache();

const App = (props) => {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;
  const getLayout = Component.getLayout ?? ((page) => page);
  const queryClient = new QueryClient();

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <title>
          BOLD Knowledge Base Profiler
        </title>
        <meta
          name="viewport"
          content="initial-scale=1, width=device-width"
        />
      </Head>
      <QueryClientProvider client={queryClient}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <ThemeProvider theme={theme}>
            <TasksProvider>
              <SnackbarProvider maxSnack={3}>
                <CssBaseline/>
                {getLayout(<Component {...pageProps} />)}
                <TasksWidget/>
              </SnackbarProvider>
            </TasksProvider>
          </ThemeProvider>
        </LocalizationProvider>
      </QueryClientProvider>
    </CacheProvider>
  );
};

export default App;
