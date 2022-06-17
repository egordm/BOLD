import Head from 'next/head';
import { Box, Container } from '@mui/material';
import { Layout } from '../components/layout/layout';


const ReportsPage = () => (
  <>
    <Head>
      <title>
        BOLD Reports
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

      </Container>
    </Box>
  </>
);

ReportsPage.getLayout = (page) => (
  <Layout showNavbar={false}>
    {page}
  </Layout>
);

export default ReportsPage;
