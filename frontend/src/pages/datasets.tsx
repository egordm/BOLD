import Head from 'next/head';
import { Box, Button, Card, CardContent, CardHeader, Container } from '@mui/material';
import React from "react";
import { useQueryClient } from "react-query";
import { Layout } from '../components/layout/layout';
import { ModalContainer } from "../components/layout/ModalContainer";
import { DatasetCreateForm } from "../containers/datasets/DatasetCreateForm";
import { DatasetsGrid } from "../containers/datasets/DatasetsGrid";


const DatasetsPage = () => {
  const queryClient = useQueryClient()
  const [ openCreateForm, setOpenCreateForm ] = React.useState(false);


  return (
    <>
      <Head>
        <title>
          BOLD Datasets
        </title>
      </Head>
      <Box component="main" sx={{ flexGrow: 1, py: 8 }}>
        <Container maxWidth={false}>
          <Card>
            <CardHeader
              title="Datasets"
              action={
                <Button variant="contained" onClick={() => setOpenCreateForm(true)}>Create Dataset</Button>
              }
            />
            <CardContent>
              <DatasetsGrid/>
            </CardContent>
          </Card>
        </Container>
      </Box>
      <ModalContainer
        title="Create Dataset"
        open={openCreateForm}
        onClose={() => setOpenCreateForm(false)}
      >
        <DatasetCreateForm onClose={async (created) => {
          setOpenCreateForm(false);
          if (created) {
            await queryClient.invalidateQueries('/datasets/');
          }
        }}/>
      </ModalContainer>
    </>
  );
}

DatasetsPage.getLayout = (page) => (
  <Layout showNavbar={false}>
    {page}
  </Layout>
);

export default DatasetsPage;
