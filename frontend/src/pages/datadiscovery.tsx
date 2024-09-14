// import Head from 'next/head';
import { Box, Button, Card, CardContent, CardHeader, Container } from '@mui/material';
import React from "react";
import { Layout } from '../components/layout/layout';
import { DatadiscoveryGrid } from "../containers/datadiscovery/DatadiscoveryGrid";


const DataDiscoveryPage = () => {
  return (
    <>
      <Box component="main" sx={{ flexGrow: 1, py: 8 }}>
        <Container maxWidth={false}>
          <Card>
            <CardHeader title="Discovery" />
            <CardContent>
            <DatadiscoveryGrid/>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </>
  );
}

DataDiscoveryPage.getLayout = (page) => (
  <Layout showNavbar={false}>
    {page}
  </Layout>
);

export default DataDiscoveryPage;
