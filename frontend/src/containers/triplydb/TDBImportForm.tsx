import { TabContext, TabList, TabPanel } from "@mui/lab";
import {
  Backdrop,
  Box,
  Button, Checkbox,
  CircularProgress, FormControl, FormControlLabel, FormGroup, FormHelperText, FormLabel,
  Grid, InputLabel, Link, ListItem, ListItemText, MenuItem, Select,
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
import { fieldProps } from "../../utils/forms";

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
  const apiURL = `https://api.triplydb.com/datasets/${dataset.owner.accountName}/${dataset.name}`;
  const sparqlURL = `${apiURL}/services/${dataset.name}/sparql`;

  const validationSchema = yup.object({});
  console.log(dataset);

  const formik = useFormik({
    initialValues: {
      name: dataset.displayName as string,
      description: (dataset.description ?? '') as string,
      use_sparql: false,
      search_mode: 'LOCAL' as string
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setLoading(true);

      try {
        const source = values.use_sparql ? {
          source_type: 'sparql',
          sparql: sparqlURL,
        } : {
          source_type: 'urls',
          urls: [downloadURL],
        };

        let result = await apiClient.post<Dataset>('/datasets/', {
          name: values.name,
          description: values.description,
          mode: source.source_type === 'sparql' ? 'SPARQL' : 'LOCAL',
          search_mode: values.search_mode,
          source: {
            tdb_id: `${dataset.owner.accountName}/${dataset.name}`,
            ...source,
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
            label="Name"
            variant="outlined"
            fullWidth
            {...fieldProps(formik, 'name')}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            maxRows={4}
            label="Description"
            variant="outlined"
            multiline
            fullWidth
            {...fieldProps(formik, 'description')}
          />
        </Grid>
        <Grid item xs={12}>
          <FormControl component="fieldset" variant="standard">
            <FormLabel component="legend">Downloads</FormLabel>
            <FormGroup>
              <FormControlLabel
                control={<Checkbox
                  checked={!formik.values.use_sparql}
                  value={!formik.values.use_sparql}
                  onChange={(e) => formik.setFieldValue('use_sparql', !e.target.checked)}
                />}
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
        <Grid item xs={12}>
          <FormControl component="fieldset" variant="standard">
            <FormLabel component="legend">SPARQL Endpoints</FormLabel>
            <FormGroup>
              <FormControlLabel
                control={<Checkbox
                  checked={formik.values.use_sparql}
                  value={formik.values.use_sparql}
                  onChange={(e) => {
                    formik.setFieldValue('use_sparql', e.target.checked)
                    if (e.target.checked) {
                      formik.setFieldValue('search_mode', 'TRIPLYDB');
                    }
                  }}
                />}
                label={(
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={
                        <Link href={sparqlURL} target="_blank">
                          SPAQRQL Service <OpenInNewIcon fontSize="small"/>
                        </Link>}
                    />
                  </ListItem>
                )}
              />
            </FormGroup>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel id="search_mode_label">Search Mode</InputLabel>
            <Select labelId="search_mode_label" label="Search Mode"  {...fieldProps(formik, 'search_mode')} >
              <MenuItem value="LOCAL">Build Local Search Index</MenuItem>
              <MenuItem value='WIKIDATA'>Use WikiData API</MenuItem>
              <MenuItem value='TRIPLYDB'>Use TriplyDB API</MenuItem>
            </Select>
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
