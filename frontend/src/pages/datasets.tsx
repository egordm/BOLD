import Head from 'next/head';
import { Box, Container } from '@mui/material';
import { Layout } from '../components/layout/layout';
import { DatasetsGrid } from "../containers/datasets/DatasetsGrid";


const DatasetsPage = () => (
  <>
    <Head>
      <title>
        BOLD Datasets
      </title>
    </Head>
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        py: 8
      }}
    >
      <Container maxWidth={false}>
        <DatasetsGrid/>
      </Container>
    </Box>
  </>
);

DatasetsPage.getLayout = (page) => (
  <Layout showNavbar={false}>
    {page}
  </Layout>
);

export default DatasetsPage;
