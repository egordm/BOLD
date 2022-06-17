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
  const [msg, sendNotification] = useNotification();
  const {
    onClose,
  } = props;


  const validationSchema = yup.object({});

  const formik = useFormik<Partial<Dataset>>({
    initialValues: {
      name: "",
      description: "",
      database: undefined,
      source: undefined,
      sparql_endpoint: undefined,
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setLoading(true);

      try {
        let result: AxiosResponse<Dataset> = null;
        if (mode === 'existing') {
          console.log(values);
        } else if (mode === 'lodc') {
          result = await apiClient.post('/datasets/create_lodc/', {
            ...values
          })
        } else if (mode === 'url') {
          result = await apiClient.post('/datasets/create_existing/', {
            ...values
          })
        }

        if (result) {
          if (result.status === 201) {
            console.log(result.data);
            sendNotification({
              msg: "Dataset scheduled for creation",
              variant: "success"
            })
            onClose(true);
          } else {
            sendNotification({
              msg: "Error creating dataset",
              variant: "error"
            })
          }
        }
      } catch (e) {
        console.error(e);
      }

      setLoading(false);
    },
  });

  const [ data, setData ] = useState<Partial<Dataset>>({
    name: "",
    description: "",
    database: undefined,
    source: undefined,
    sparql_endpoint: undefined,
  });


  return (
    <form onSubmit={formik.handleSubmit}>
      <Grid
        container
        spacing={3}
      >
        <Grid
          item
          xs={12}
        >
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
        <Grid
          item
          xs={12}
        >
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
        <Grid
          item
          xs={12}
        >
          <TabContext value={mode}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <TabList
                onChange={(e, v) => setMode(v)}
                aria-label="basic tabs example"
                centered
              >
                <Tab label="Existing" value="existing"/>
                <Tab label="Linked Open Data Cloud" value="lodc"/>
                <Tab label="From URL" value="url"/>
              </TabList>
            </Box>
            <TabPanel value="existing">
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    label="Database"
                    variant="outlined"
                    fullWidth
                    value={data.database}
                    onChange={(e) => {
                      setData({ ...data, database: e.target.value });
                    }}
                  />
                </Grid>
              </Grid>
            </TabPanel>
            <TabPanel value="lodc">
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    name="source"
                    label="Linked Open Data Cloud Name"
                    variant="outlined"
                    fullWidth
                    value={formik.values.source}
                    onChange={formik.handleChange}
                    error={formik.touched.source && Boolean(formik.errors.source)}
                    helperText={formik.touched.source && formik.errors.source}
                  />
                </Grid>
              </Grid>
            </TabPanel>
            <TabPanel value="url">
              <Grid
                container
                spacing={3}
              >
                <Grid item xs={12}>
                  <TextField
                    name="source"
                    label="Url to dataset"
                    variant="outlined"
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
                    value={formik.values.sparql_endpoint}
                    onChange={formik.handleChange}
                    error={formik.touched.sparql_endpoint && Boolean(formik.errors.sparql_endpoint)}
                    helperText={formik.touched.sparql_endpoint && formik.errors.sparql_endpoint}
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
        <CircularProgress color="inherit" />
      </Backdrop>
    </form>
  )
}
