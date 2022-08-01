import { Box, Button, Card, CardContent, CardHeader, Container, Modal } from '@mui/material';
import React from "react";
import { Layout } from '../components/layout/layout';
import { ModalContainer } from "../components/layout/ModalContainer";
import { ReportCreateForm } from "../containers/reports/ReportCreateFrom";
import { ReportsGrid } from "../containers/reports/ReportsGrid";


const ReportsPage = () => {
  const [ openCreateForm, setOpenCreateForm ] = React.useState(false);

  return (
    <>
{/*      <Head>
        <title>
          BOLD Reports
        </title>
      </Head>*/}
      <Box component="main" sx={{ flexGrow: 1, py: 8 }}>
        <Container maxWidth={false}>
          <Card>
            <CardHeader
              title="Reports"
              action={
                <Button variant="contained" onClick={() => setOpenCreateForm(true)}>Create Report</Button>
              }
            />
            <CardContent>
              <ReportsGrid/>
            </CardContent>
          </Card>
        </Container>
      </Box>
      <ModalContainer
        title="Create Report"
        open={openCreateForm}
        onClose={() => setOpenCreateForm(false)}
      >
        <ReportCreateForm onClose={(created) => {
          setOpenCreateForm(false);
        }}/>
      </ModalContainer>
    </>
  );
}

ReportsPage.getLayout = (page) => (
  <Layout showNavbar={false}>
    {page}
  </Layout>
);

export default ReportsPage;
