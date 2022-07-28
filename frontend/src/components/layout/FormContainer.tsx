import { Backdrop, CircularProgress, Grid, Stack } from "@mui/material";
import { useFormik } from "formik";
import React from "react";


export const FormContainer = <T, >(props: {
  children?: React.ReactNode;
  loading?: boolean;
  actions?: React.ReactNode;
  form?: ReturnType<typeof useFormik<T>>
}) => {
  const { children, actions, form, loading = false, ...rest } = props;

  return (
    <form
      onSubmit={form?.handleSubmit}
      {...rest}
    >
      <Grid container spacing={2}>
        <Grid item xs={12}>
          {children}
        </Grid>
        {!!actions &&
            <Grid item xs={12}>
                <Stack direction="row" justifyContent="flex-end" spacing={1}>
                  {actions}
                </Stack>
            </Grid>
        }
      </Grid>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}>
        <CircularProgress color="inherit"/>
      </Backdrop>
    </form>
  )
}
