import Head from 'next/head';
import { Box, Container } from '@mui/material';
import { Layout } from '../components/layout/layout';
import { LODCListing } from "../containers/lodc/LODCListing";
import { TasksGrid } from "../containers/tasks/TasksGrid";


const LODCPage = () => (
  <>
    <Head>
      <title>
        BOLD LODC datasets
      </title>
    </Head>
    <Box
      component="main"
      sx={{ flexGrow: 1, py: 8 }}
    >
      <Container maxWidth={false}>
        <LODCListing/>
      </Container>
    </Box>
  </>
);

LODCPage.getLayout = (page) => (
  <Layout showNavbar={false}>
    {page}
  </Layout>
);

export default LODCPage;
