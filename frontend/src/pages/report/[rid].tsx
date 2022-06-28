import Head from 'next/head';
import { Box, Container } from '@mui/material';
import { useRouter } from "next/router";
import { Layout } from '../../components/layout/layout';
import { Notebook } from "../../components/notebook/Notebook";
import { CellFocusProvider } from "../../providers/CellFocusProvider";
import { NotebookConnectionProvider } from "../../providers/NotebookConnectionProvider";
import { NotebookProvider } from "../../providers/NotebookProvider";
import { ReportProvider } from "../../providers/ReportProvider";


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
      <Box component="main" sx={{ flexGrow: 1, py: 8 }}>
        <Container maxWidth={'lg'}>
          {rid && (
            <ReportProvider reportId={rid as string}>
              <NotebookConnectionProvider reportId={rid as string}>
                <NotebookProvider>
                  <CellFocusProvider>
                    <Notebook/>
                  </CellFocusProvider>
                </NotebookProvider>
              </NotebookConnectionProvider>
            </ReportProvider>
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
