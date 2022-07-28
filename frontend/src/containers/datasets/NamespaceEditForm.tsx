import AddIcon from "@mui/icons-material/Add";
import {
  Button,
  Grid, Stack,
  TextField
} from "@mui/material"
import { useFormik } from "formik";
import React, { useCallback, useMemo, useState } from "react";
import { IconButton } from "../../components/input/IconButton";
import { FormContainer } from "../../components/layout/FormContainer";
import useNotification from "../../hooks/useNotification";
import { Dataset } from "../../types/datasets";
import * as yup from 'yup';
import { apiClient } from "../../utils/api";
import DeleteIcon from '@mui/icons-material/Delete';


export const NamespaceEditForm = (props: {
  dataset: Dataset;
  onClose: (updated: boolean) => void;
}) => {
  const [ loading, setLoading ] = useState(false);
  const { sendNotification } = useNotification();
  const { onClose, dataset,  } = props;

  const validationSchema = yup.object({});

  const formik = useFormik({
    initialValues: {
      namespaces: dataset.namespaces,
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setLoading(true);

      try {
        const result = await apiClient.put<Dataset>(`/datasets/${dataset?.id}/`, {
          ...dataset,
          namespaces: values.namespaces,
        });

        if (result) {
          if (result.status === 200) {
            sendNotification({ variant: "success", message: "Updated dataset namespaces" });
            onClose(true);
          } else {
            sendNotification({ variant: "error", message: "Error updating dataset namespaces" });
          }
        }
      } catch (e) {
        console.error(e);
        sendNotification({ variant: "error", message: "Error updating dataset namespaces" });
      }

      setLoading(false);
    },
  });

  const Fields = (
    <>
      {formik.values.namespaces.map((namespace, i) => (
        <Stack key={i} direction="row">
          <TextField
            label="Prefix"
            variant="filled"
            name={`namespaces[${i}].prefix`}
            value={namespace.prefix}
            onChange={formik.handleChange}
          />
          <TextField
            label="URI"
            variant="filled"
            name={`namespaces[${i}].name`}
            value={namespace.name}
            onChange={formik.handleChange}
            sx={{flex: 1}}
          />
          <IconButton
            label={"Delete"}
            icon={<DeleteIcon/>}
            onClick={() => formik.setFieldValue(
              'namespaces', formik.values.namespaces.filter((_, j) => i !== j)
            )}
          />
        </Stack>
      ))}
    </>
  )

  const addNamespace = useCallback(() => {
    formik.setFieldValue(
      'namespaces', [...formik.values.namespaces, { prefix: "", name: "" }]
    )
  }, [formik.values.namespaces]);

  return (
    <FormContainer
      form={formik}
      loading={loading}
      actions={<>
        <Button variant="contained" type="submit">Submit</Button>
      </>}
    >
      <Stack>
        {Fields}
      </Stack>
      <Stack direction={"row"} justifyContent={"center"} sx={{pt: 2}}>
        <Button variant="text" startIcon={<AddIcon/>} onClick={addNamespace}> Add namespace</Button>
      </Stack>
    </FormContainer>
  )
}
