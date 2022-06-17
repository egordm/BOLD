import Head from 'next/head';
import { Box, Container } from '@mui/material';
import { Layout } from '../components/layout/layout';
import { TasksGrid } from "../containers/tasks/TasksGrid";


const TasksPage = () => (
  <>
    <Head>
      <title>
        BOLD Tasks
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
        <TasksGrid/>
      </Container>
    </Box>
  </>
);

TasksPage.getLayout = (page) => (
  <Layout showNavbar={false}>
    {page}
  </Layout>
);

export default TasksPage;
