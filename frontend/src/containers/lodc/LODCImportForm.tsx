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
import { FormContainer } from "../../components/layout/FormContainer";
import { useApi } from "../../hooks/useApi";
import useNotification from "../../hooks/useNotification";
import { LODCDataset, LODCDownload } from "../../services/lodc";
import { Dataset } from "../../types/datasets";
import * as yup from 'yup';
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
      if (fieldName === 'sparql') {
        formik.setFieldValue('files', []);
      } else {
        formik.setFieldValue('sparql', []);
      }

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


export const LODCImportForm = (props: {
  dataset: LODCDataset,
  onComplete: (created: boolean) => void;
}) => {
  const [ loading, setLoading ] = useState(false);
  const { sendNotification } = useNotification();
  const {
    dataset,
    onComplete,
  } = props;


  const validationSchema = yup.object({});

  const apiClient = useApi();

  const formik = useFormik({
    initialValues: {
      name: dataset.title as string,
      description: (dataset.description?.en || '') as string,
      files: [] as string[],
      sparql: [] as string[],
      search_mode: 'LOCAL' as string,
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setLoading(true);

      try {
        let result: AxiosResponse<Dataset> = null;
        const source = values.sparql.length ? {
          source_type: 'sparql',
          sparql: values.sparql[0],
        } : {
          source_type: 'urls',
          urls: values.files,
        };

        result = await apiClient.post('/datasets/', {
          name: values.name,
          description: values.description,
          source: {
            lodc_id: dataset.identifier,
            ...source,
          },
          mode: source.source_type === 'sparql' ? 'SPARQL' : 'LOCAL',
          search_mode: values.search_mode,
        })

        if (result) {
          if (result.status === 201) {
            console.log(result.data);
            sendNotification({ message: "LODC dataset scheduled for import", variant: "success" })
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
    <FormContainer
      form={formik}
      loading={loading}
      actions={<>
        <Button variant="contained" type="submit">Submit</Button>
      </>}
    >
      <Grid container spacing={3} >
        <Grid item xs={12}>
          <Link href={`https://lod-cloud.net/dataset/${dataset.identifier}`} target="_blank">
            <Typography variant="body2">Open on Linked Open Data Cloud <OpenInNewIcon fontSize="small"/></Typography>
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
          <DownloadSelection
            formik={formik}
            fieldName="files"
            title="Full download"
            emptyMessage="No full downloads available"
            options={dataset.full_download}
          />
        </Grid>
        <Grid item xs={12}>
          <DownloadSelection
            formik={formik}
            fieldName="files"
            title="Other download"
            emptyMessage="No other downloads available"
            options={dataset.other_download}
          />
        </Grid>
        <Grid item xs={12}>
          <DownloadSelection
            formik={formik}
            fieldName="sparql"
            title="SPARQL endpoint"
            emptyMessage="No SPARQL endpoints available"
            restrictKG={false}
            options={dataset.sparql}
          />
        </Grid>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel id="search_mode_label">Search Mode</InputLabel>
            <Select labelId="search_mode_label" label="Search Mode"  {...fieldProps(formik, 'search_mode')} >
              <MenuItem value="LOCAL">Build Local Search Index</MenuItem>
              <MenuItem value='WIKIDATA'>Use WikiData API</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </FormContainer>
  )
}
