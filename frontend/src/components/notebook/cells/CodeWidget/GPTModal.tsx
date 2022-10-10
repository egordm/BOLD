import LightbulbIcon from "@mui/icons-material/Lightbulb";
import { Button, Fab, InputAdornment, TextField, Typography } from "@mui/material";
import { AxiosResponse } from "axios";
import { useFormik } from "formik";
import React, { useMemo, useState } from "react";
import * as yup from "yup";
import { useApi } from "../../../../hooks/useApi";
import useNotification from "../../../../hooks/useNotification";
import { useDatasetContext } from "../../../../providers/DatasetProvider";
import { GPTOutput } from "../../../../types/reports";
import { fieldProps } from "../../../../utils/forms";
import { FormContainer } from "../../../layout/FormContainer";
import { ModalContainer } from "../../../layout/ModalContainer";


const GPTPromptModal = ({
  open,
  templatePrompt,
  templateOutput,
  onClose,
}: {
  open: boolean;
  templatePrompt: string;
  templateOutput: string;
  onClose: (result?: { prompt: string; output: string }) => void;
}) => {
  const [ loading, setLoading ] = useState(false);
  const { sendNotification } = useNotification();

  const apiClient = useApi();

  const formik = useFormik({
    initialValues: {
      prompt: undefined as string | undefined,
    },
    validationSchema: yup.object({}),
    onSubmit: async (values) => {
      setLoading(true);

      try {
        const prompt = values.prompt.replace(/\n/g, " ");
        const result: AxiosResponse<GPTOutput> = await apiClient.post('/services/gpt_prompt', {
          prompt: templatePrompt.replaceAll('{{prompt}}', prompt),
        })

        if (result) {
          if (result.status === 200) {
            sendNotification({ variant: "success", message: "Report created" })
            onClose({
              prompt,
              output: templateOutput
                .replaceAll('{{prompt}}', prompt)
                .replaceAll('{{output}}', result.data.choices[0].text)
                .trim()
            });
          } else {
            sendNotification({ variant: "error", message: "GPT error, check if it is set up correctly" })
          }
        }
      } catch (e) {
        console.error(e);
      }

      setLoading(false);
    },
  });

  return (
    <ModalContainer
      title={'GPT Text to SPARQL query'}
      open={open}
      onClose={onClose}>
      <FormContainer
        form={formik}
        actions={<>
          <Button variant="contained" type="submit">Submit</Button>
        </>}
        loading={loading}
      >
        <TextField
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Typography>Query must </Typography>
              </InputAdornment>
            ),
          }}
          {...fieldProps(formik, 'prompt')}
          placeholder="calculate a while returning b and c"
          multiline fullWidth
          rows={4}
          variant="standard"
          sx={{ alignItems: 'start' }}
          inputProps={{
            style: { alignItems: 'start' }
          }}
        />
      </FormContainer>
    </ModalContainer>
  )
}


export const GPTModal = ({
  setSource
}: {
  setSource: (source: string) => void;
}) => {
  const { dataset } = useDatasetContext();

  const { templatePrompt, templateOutput } = useMemo(() => {
    const prefixes = (dataset?.namespaces ?? [])
      .filter((ns) => ns.prefix)
      .map(ns => `PREFIX ${ns.prefix}: <${ns.name}>`).join('\n');

    return {
      templatePrompt: `
        ### Generate SPARQL query that should
        ### {{prompt}}
        ${prefixes}
        SELECT 
        `.replace(/^ +/gm, '').trim(),
      templateOutput: `
        ### GPT output for: {{prompt}}
        ${prefixes}
        SELECT {{output}}
        `.replace(/^ +/gm, '').trim()
    }
  }, [ dataset ]);

  const [ open, setOpen ] = useState(false);

  return (
    <>
      <Fab size="small" color="secondary" sx={{
        position: 'absolute',
        right: 4,
        top: 4
      }} onClick={() => setOpen(true)}>
        <LightbulbIcon/>
      </Fab>
      <GPTPromptModal
        open={open}
        templatePrompt={templatePrompt}
        templateOutput={templateOutput}
        onClose={(result) => {
          setOpen(false);

          if (result && result.output) {
            setSource(result.output.trim())
          }
        }}
      />
    </>
  )
}
