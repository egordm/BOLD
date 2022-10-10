import { Box } from '@mui/material';
import { useMatch } from "react-router";
// import { useRouter } from "next/router";
import { Layout } from '../../components/layout/layout';
import { Notebook } from "../../components/notebook/Notebook";
import { CellFocusProvider } from "../../providers/CellFocusProvider";
import { DatasetProvider } from "../../providers/DatasetProvider";
import { NotebookConnectionProvider } from "../../providers/NotebookConnectionProvider";
import { NotebookProvider } from "../../providers/NotebookProvider";
import { ReportProvider } from "../../providers/ReportProvider";
import { RunQueueProvider } from "../../providers/RunQueueProvider";
import { UndoHistoryProvider } from "../../providers/UndoHistoryProvider";


const NotebookPage = (props) => {
  const match = useMatch('/report/:rid');
  const rid = match.params.rid;
  // const router = useRouter()
  // const { rid } = router.query
  console.log(rid)

  return (
    <>
      {/* <Head>
        <title>
          BOLD Profiler
        </title>
      </Head>*/}
      <Box component="main">
        {rid && (
          <ReportProvider reportId={rid as string}>
            <DatasetProvider>
              <NotebookConnectionProvider reportId={rid as string}>
                <NotebookProvider>
                  <UndoHistoryProvider>
                    <CellFocusProvider>
                      <RunQueueProvider>
                        <Notebook/>
                      </RunQueueProvider>
                    </CellFocusProvider>
                  </UndoHistoryProvider>
                </NotebookProvider>
              </NotebookConnectionProvider>
            </DatasetProvider>
          </ReportProvider>
        )}
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
