import { TabContext, TabList, TabPanel } from "@mui/lab";
import {
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Grid,
  Tab,
  TextField
} from "@mui/material"
import { AxiosResponse } from "axios";
import { useFormik } from "formik";
import { useState } from "react";
import useNotification from "../../hooks/useNotification";
import { Dataset } from "../../types/datasets";
import * as yup from 'yup';
import { apiClient } from "../../utils/api";


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

  const formik = useFormik({
    initialValues: {
      name: "" as string,
      description: "" as string,
      database: '' as string,
      source: '' as string,
      sparql: '' as string,
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setLoading(true);

      try {
        const source = mode === 'existing' ? {
          source_type: 'existing',
          database: values.database,
        } : {
          source_type: 'urls',
          urls: values.source.split(/\r|\n/),
          sparql: values.sparql ? [ values.sparql ] : [],
        };

        const result = await apiClient.post<Dataset>('/datasets/', {
          name: values.name,
          description: values.description,
          source,
        })

        if (result) {
          if (result.status === 201) {
            sendNotification({ variant: "success", message: "Dataset scheduled for creation" })
            onClose(true);
          } else {
            sendNotification({ variant: "error", message: "Error creating dataset" })
          }
        }
      } catch (e) {
        console.error(e);
      }

      setLoading(false);
    },
  });


  return (
    <form onSubmit={formik.handleSubmit}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            name="name"
            label="Name"
            variant="outlined"
            fullWidth
            value={formik.values.name}
            onChange={formik.handleChange}
            error={formik.touched.name && Boolean(formik.errors.name)}
            helperText={formik.touched.name && formik.errors.name}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            name="description"
            label="Description"
            variant="outlined"
            multiline
            fullWidth
            value={formik.values.description}
            onChange={formik.handleChange}
            error={formik.touched.description && Boolean(formik.errors.description)}
            helperText={formik.touched.description && formik.errors.description}
          />
        </Grid>
        <Grid item xs={12}>
          <TabContext value={mode}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <TabList
                onChange={(e, v) => setMode(v)}
                aria-label="basic tabs example"
                centered
              >
                <Tab label="Existing" value="existing"/>
                <Tab label="From URL(s)" value="url"/>
              </TabList>
            </Box>
            <TabPanel value="existing">
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    name="database"
                    label="Database"
                    variant="outlined"
                    fullWidth
                    value={formik.values.database}
                    onChange={formik.handleChange}
                    error={formik.touched.database && Boolean(formik.errors.database)}
                    helperText={formik.touched.database && formik.errors.database}
                  />
                </Grid>
              </Grid>
            </TabPanel>
            <TabPanel value="url">
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    name="source"
                    label="Url to dataset"
                    placeholder="Urls separated by newline"
                    variant="outlined"
                    multiline
                    rows={3}
                    fullWidth
                    value={formik.values.source}
                    onChange={formik.handleChange}
                    error={formik.touched.source && Boolean(formik.errors.source)}
                    helperText={formik.touched.source && formik.errors.source}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="sparql_endpoint"
                    label="Sparql endpoint"
                    variant="outlined"
                    fullWidth
                    value={formik.values.sparql}
                    onChange={formik.handleChange}
                    error={formik.touched.sparql && Boolean(formik.errors.sparql)}
                    helperText={formik.touched.sparql && formik.errors.sparql}
                  />
                </Grid>
              </Grid>
            </TabPanel>
          </TabContext>
        </Grid>
        <Grid
          item
          xs={12}
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <Button variant="contained" type="submit">Submit</Button>
        </Grid>
      </Grid>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit"/>
      </Backdrop>
    </form>
  )
}
