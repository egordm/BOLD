import Head from 'next/head';
import { Box, Card, CardContent, CardHeader, Container } from '@mui/material';
import { Layout } from '../components/layout/layout';
import { TriplyDBGrid } from "../containers/triplydb/TriplyDBGrid";


const TriplyDBPage = () => (
  <>
    <Head>
      <title>
        BOLD Triply DB datasets
      </title>
    </Head>
    <Box component="main" sx={{ flexGrow: 1, py: 8 }}>
      <Container maxWidth={false}>
        <Card>
          <CardHeader
            title="Triply DB Datasets"
          />
          <CardContent>
            <TriplyDBGrid/>
          </CardContent>
        </Card>
      </Container>
    </Box>
  </>
);

TriplyDBPage.getLayout = (page) => (
  <Layout showNavbar={false}>
    {page}
  </Layout>
);

export default TriplyDBPage;
