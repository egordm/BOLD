import { TabContext, TabList, TabPanel } from "@mui/lab";
import {
  Backdrop,
  Box,
  Button, Checkbox,
  CircularProgress, FormControl, FormControlLabel, FormGroup, FormHelperText, FormLabel,
  Grid, Link, ListItem, ListItemText,
  Tab,
  TextField, Typography
} from "@mui/material"
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { AxiosResponse } from "axios";
import { useFormik } from "formik";
import React, { useCallback, useState } from "react";
import useNotification from "../../hooks/useNotification";
import { LODCDataset, LODCDownload } from "../../services/lodc";
import { TDBDataset } from "../../services/triplydb";
import { Dataset } from "../../types/datasets";
import * as yup from 'yup';
import { apiClient } from "../../utils/api";
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export const DownloadSelection = (props: {
  formik: any;
  fieldName: string;
  title: string;
  emptyMessage: string;
  options: LODCDownload[];
  restrictKG?: boolean;
}) => {
  const { formik, fieldName, title, emptyMessage, options, restrictKG = true } = props;

  const onCheckedChange = useCallback((e, url) => {
    if (e.target.checked) {
      formik.setFieldValue(fieldName, [ ...formik.values[fieldName], url ]);
    } else {
      formik.setFieldValue(fieldName, formik.values[fieldName].filter(f => f !== url));
    }
  }, [ formik, fieldName ]);

  return (
    <FormControl component="fieldset" variant="standard">
      <FormLabel component="legend">{title}</FormLabel>
      <FormGroup>
        {options.map((download, index) => (
          <FormControlLabel
            key={index}
            control={
              <Checkbox
                checked={formik.values[fieldName].includes(download.url)}
                onChange={(e) => onCheckedChange(e, download.url)}
                disabled={!download.available || (restrictKG && download.detect_kg == "NO")}
              />
            }
            label={(
              <ListItem alignItems="flex-start">
                <ListItemText
                  primary={
                    <Link href={download.url} target="_blank">
                      {download.title} <OpenInNewIcon fontSize="small"/> {!download.available &&
                        <WarningAmberIcon fontSize="small"/>}
                    </Link>}
                  secondary={download.description}
                />
              </ListItem>
            )}
          />
        ))}
        {options.length === 0 && (
          <Typography variant="body2">{emptyMessage}</Typography>
        )}
      </FormGroup>
    </FormControl>
  )
}


export const TDBImportForm = (props: {
  dataset: TDBDataset,
  onComplete: (created: boolean) => void;
}) => {
  const [ loading, setLoading ] = useState(false);
  const { sendNotification } = useNotification();
  const {
    dataset,
    onComplete,
  } = props;

  const datasetURL = `https://triplydb.com/${dataset.owner.accountName}/${dataset.name}`;
  const downloadURL = `${datasetURL}/download.ttl.gz`;


  const validationSchema = yup.object({});
  console.log(dataset);

  const formik = useFormik({
    initialValues: {
      name: dataset.displayName as string,
      description: (dataset.description ?? '') as string,
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setLoading(true);

      try {
        let result = await apiClient.post<Dataset>('/datasets/', {
          name: values.name,
          description: values.description,
          source: {
            source_type: 'tdb',
            tdb_id: `${dataset.owner.accountName}/${dataset.name}`,
            urls: [downloadURL],
          },
        })

        if (result) {
          if (result.status === 201) {
            console.log(result.data);
            sendNotification({ message: "TriplyDB dataset scheduled for import", variant: "success" })
            onComplete(true);
          } else {
            sendNotification({ message: "Error creating dataset", variant: "error" })
          }
        }
      } catch (e) {
        console.error(e);
      }

      setLoading(false);
    },
  });

  React.useEffect(() => {
    formik.resetForm()
  }, [ dataset ]);

  return (
    <form onSubmit={formik.handleSubmit}>
      <Grid
        container
        spacing={3}
      >
        <Grid item xs={12}>
          <Link href={datasetURL} target="_blank">
            <Typography variant="body2">Open on TripleDB <OpenInNewIcon fontSize="small"/></Typography>
          </Link>
        </Grid>
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
            maxRows={4}
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
          <FormControl component="fieldset" variant="standard">
            <FormLabel component="legend">Downloads</FormLabel>
            <FormGroup>
              <FormControlLabel
                control={<Checkbox checked={true}/>}
                label={(
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={
                        <Link href={downloadURL} target="_blank">
                          download.ttl.gz <OpenInNewIcon fontSize="small"/>
                        </Link>}
                    />
                  </ListItem>
                )}
              />
            </FormGroup>
          </FormControl>
        </Grid>
        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', }}>
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
