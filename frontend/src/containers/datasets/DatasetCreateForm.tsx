import { TabContext, TabList, TabPanel } from "@mui/lab";
import {
  Backdrop,
  Box,
  Button,
  CircularProgress, FormControl,
  Grid, InputLabel, MenuItem, Select,
  Tab,
  TextField
} from "@mui/material"
import { useFormik } from "formik";
import { useState } from "react";
import { FormContainer } from "../../components/layout/FormContainer";
import { useApi } from "../../hooks/useApi";
import useNotification from "../../hooks/useNotification";
import { Dataset } from "../../types/datasets";
import * as yup from 'yup';
import { fieldProps } from "../../utils/forms";


export const DatasetCreateForm = (props: {
  onClose: (created: boolean) => void;
}) => {
  const [ mode, setMode ] = useState('existing');
  const [ loading, setLoading ] = useState(false);
  const { sendNotification } = useNotification();
  const {
    onClose,
  } = props;


  const validationSchema = yup.object({});

  const apiClient = useApi();
  const formik = useFormik({
    initialValues: {
      name: "" as string,
      description: "" as string,
      database: '' as string,
      source: '' as string,
      sparql: '' as string,
      search_mode: 'LOCAL' as string,
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setLoading(true);

      try {
        const source = mode === 'existing' ? {
          source_type: 'existing',
          database: values.database,
        } : mode === 'urls' ? {
          source_type: 'urls',
          urls: values.source.split(/\r|\n/),
        } : {
          source_type: 'sparql',
          sparql: values.sparql,
        };

        const result = await apiClient.post<Dataset>('/datasets/', {
          name: values.name,
          description: values.description,
          source,
          search_mode: values.search_mode,
          mode: mode === 'sparql' ? 'SPARQL' : 'LOCAL',
        });

        if (result) {
          if (result.status === 201) {
            sendNotification({ variant: "success", message: "Dataset scheduled for creation" });
            onClose(true);
          } else {
            sendNotification({ variant: "error", message: "Error creating dataset" });
          }
        }
      } catch (e) {
        console.error(e);
        sendNotification({ variant: "error", message: "Error creating dataset" });
      }

      setLoading(false);
    },
  });

  return (
    <FormContainer
      form={formik}
      loading={loading}
      actions={<>
        <Button variant="contained" type="submit">Submit</Button>
      </>}
    >
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            label="Name"
            variant="outlined"
            fullWidth
            {...fieldProps(formik, 'name')}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Description"
            variant="outlined"
            multiline
            fullWidth
            {...fieldProps(formik, 'description')}
          />
        </Grid>
        <Grid item xs={12}>
          <TabContext value={mode}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <TabList onChange={(e, v) => setMode(v)} centered>
                <Tab label="Existing" value="existing"/>
                <Tab label="Import URL(s)" value="urls"/>
                <Tab label="SPARQL Endpoint" value="sparql"/>
              </TabList>
            </Box>
            <TabPanel value="existing">
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    label="Database"
                    variant="outlined"
                    fullWidth
                    {...fieldProps(formik, 'database')}
                  />
                </Grid>
              </Grid>
            </TabPanel>
            <TabPanel value="urls">
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    label="URL(s) to dataset"
                    placeholder="Urls separated by newline"
                    variant="outlined"
                    multiline
                    rows={3}
                    fullWidth
                    {...fieldProps(formik, 'source')}
                  />
                </Grid>

              </Grid>
            </TabPanel>
            <TabPanel value="sparql">
              <Grid item xs={12}>
                <TextField
                  label="SPARQL Endpoint URL"
                  variant="outlined"
                  fullWidth
                  {...fieldProps(formik, 'sparql')}
                />
              </Grid>
            </TabPanel>
          </TabContext>
        </Grid>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel id="search_mode_label">Search Mode</InputLabel>
            <Select  labelId="search_mode_label" label="Search Mode"  {...fieldProps(formik, 'search_mode')} >
              <MenuItem value="LOCAL">Build Local Search Index</MenuItem>
              <MenuItem value='WIKIDATA'>Use WikiData API</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </FormContainer>
  )
}
