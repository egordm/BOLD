import Head from 'next/head';
import { Box, Container } from '@mui/material';
import { useRouter } from "next/router";
import { Layout } from '../../components/layout/layout';
import { Notebook } from "../../components/notebook/Notebook";
import { LocalNotebookProvider } from "../../providers/LocalNotebookProvider";
import { NotebookConnectionProvider } from "../../providers/NotebookConnectionProvider";
import { NotebookProvider } from "../../providers/NotebookProvider";
import { RemoteNotebookProvider } from "../../providers/RemoteNotebookProvider";


const NotebookPage = () => {
  const router = useRouter()
  const { rid } = router.query
  console.log(rid)

  return (
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
          {rid && (
            <NotebookConnectionProvider notebookId={rid as string}>
              <NotebookProvider notebookId={rid as string}>
                <Notebook/>
              </NotebookProvider>
             {/* <RemoteNotebookProvider notebookId={rid as string}>
                <LocalNotebookProvider>

                </LocalNotebookProvider>
              </RemoteNotebookProvider>*/}
            </NotebookConnectionProvider>
          )}
        </Container>
      </Box>
    </>
  );
}

NotebookPage.getLayout = (page) => (
  <Layout showNavbar={false}>
    {page}
  </Layout>
);

export default NotebookPage;
