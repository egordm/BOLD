import {
  Backdrop,
  Button,
  CircularProgress,
  Grid
} from "@mui/material"
import { AxiosResponse } from "axios";
import { useFormik } from "formik";
import { useRouter } from "next/router";
import { useState } from "react";
import { DatasetSelectInput } from "../../components/input/DatasetSelectInput";
import useNotification from "../../hooks/useNotification";
import { Dataset } from "../../types/datasets";
import * as yup from 'yup';
import { newNotebook } from "../../types/notebooks";
import { Report } from "../../types/reports";
import { apiClient } from "../../utils/api";


export const ReportCreateForm = (props: {
  onClose: (created: boolean) => void;
}) => {
  const router = useRouter()
  const [ loading, setLoading ] = useState(false);
  const { sendNotification } = useNotification();
  const {
    onClose,
  } = props;

  const validationSchema = yup.object({});

  const formik = useFormik<Partial<Report>>({
    initialValues: {
      dataset: undefined,
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setLoading(true);

      try {
        const result: AxiosResponse<Report> = await apiClient.post('/reports/', {
          dataset: values.dataset.id,
          notebook: newNotebook('Untitled Report')
        })

        if (result) {
          if (result.status === 201) {
            sendNotification({
              message: "Report created",
              variant: "success"
            })
            onClose(true);
            await router.push(`notebook/${result.data.id}`);
          } else {
            sendNotification({
              message: "Error creating report",
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
          <DatasetSelectInput
            onValueChange={(dataset) => dataset.length && formik.setFieldValue('dataset', dataset[0])}
          />
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
