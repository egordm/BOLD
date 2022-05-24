import Head from 'next/head';
import { Box, Container, Grid } from '@mui/material';
import { LatestProducts } from '../components/dashboard/latest-products';
import { DashboardLayout } from '../components/dashboard-layout';
import { FilteredDistributionProfiler } from "../components/profilers/FilteredDistributionProfiler";

const Dashboard = () => (
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
      <Container maxWidth={false}>
        <Grid
          container
          spacing={3}
        >
          <Grid
            item
            lg={6}
            md={12}
            xl={6}
            xs={12}
          >
            <FilteredDistributionProfiler sx={{ height: '100%' }} />
          </Grid>
          <Grid
            item
            lg={4}
            md={6}
            xl={3}
            xs={12}
          >
            <LatestProducts sx={{ height: '100%' }} />
          </Grid>
        </Grid>
      </Container>
    </Box>
  </>
);

Dashboard.getLayout = (page) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default Dashboard;
