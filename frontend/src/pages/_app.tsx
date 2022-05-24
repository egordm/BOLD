import Head from 'next/head';
import { CacheProvider } from '@emotion/react';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from "react-query";
import { createEmotionCache } from '../utils/create-emotion-cache';
import { theme } from '../theme';

const clientSideEmotionCache = createEmotionCache();

const App = (props) => {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;

  const getLayout = Component.getLayout ?? ((page) => page);

  const queryClient = new QueryClient();

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <title>
          Material Kit Pro
        </title>
        <meta
          name="viewport"
          content="initial-scale=1, width=device-width"
        />
      </Head>
      <QueryClientProvider client={queryClient}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <ThemeProvider theme={theme}>
            <CssBaseline/>
            {getLayout(<Component {...pageProps} />)}
          </ThemeProvider>
        </LocalizationProvider>
      </QueryClientProvider>
    </CacheProvider>
  );
};

export default App;
