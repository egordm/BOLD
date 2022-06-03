import { StreamLanguage } from "@codemirror/language";
import Head from 'next/head';
import { Box, Card, CardContent, CardHeader, Container, Divider, Grid } from '@mui/material';
import { LatestProducts } from '../components/dashboard/latest-products';
import { Layout } from '../components/layout';
import { FilteredDistributionProfiler } from "../components/profilers/FilteredDistributionProfiler";
import CodeMirror from '@uiw/react-codemirror';
import { sparql } from '@codemirror/legacy-modes/mode/sparql';
import { editorTheme } from "../theme";


const NotebookPage = () => (
  <>
    <Head>
      <title>
        BOLD Profiler
      </title>
    </Head>
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        py: 8
      }}
    >
      <Container maxWidth={'lg'}>
        <Card>
          <CardHeader
            title="Test Notebook"
          />
          <Divider/>
          <CardContent>
              <Grid container>
                <Grid item xs={12}>
                  <CodeMirror
                    value="console.log('hello world!');"
                    height="200px"
                    extensions={[ StreamLanguage.define(sparql) ]}
                    theme={editorTheme}
                    onChange={(value, viewUpdate) => {
                      console.log('value:', value);
                    }}
                  />
                </Grid>
              </Grid>
              <Grid container xs={12}>
                <Grid item>
                  <FilteredDistributionProfiler sx={{ height: '100%' }}/>
                </Grid>
              </Grid>
          </CardContent>
        </Card>
      </Container>
    </Box>
  </>
);

NotebookPage.getLayout = (page) => (
  <Layout showNavbar={false}>
    {page}
  </Layout>
);

export default NotebookPage;
