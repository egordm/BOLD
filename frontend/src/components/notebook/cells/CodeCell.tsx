import {
  Box,
  Button,
  Fab,
  Grid,
  InputAdornment, TextField,
  Typography
} from "@mui/material";
import { AxiosResponse } from "axios";
import { useFormik } from "formik";
import React, { useMemo, useState } from "react";
import * as yup from "yup";
import { useApi } from "../../../hooks/useApi";
import useNotification from "../../../hooks/useNotification";
import { useCellContext } from "../../../providers/CellProvider";
import { usePrefixes, useReportContext } from "../../../providers/ReportProvider";
import { CodeCellType} from "../../../types/notebooks";
import { GPTOutput} from "../../../types/reports";
import { fieldProps } from "../../../utils/forms";
import { cellOutputToYasgui } from "../../../utils/yasgui";
import { Yasr } from "../../data/Yasr";
import { Yasqe } from "../../input/Yasqe";
import { FormContainer } from "../../layout/FormContainer";
import { ModalContainer } from "../../layout/ModalContainer";
import LightbulbIcon from '@mui/icons-material/Lightbulb';

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

export const CodeCell = (props:
  {}
) => {
  const { cell, outputs, setCell } = useCellContext();
  const { source } = cell as CodeCellType;
  const editorRef = React.useRef(null);
  const prefixes = usePrefixes();

  const [ gptPromptOpen, setGptPromptOpen ] = useState(false);

  const onChange = (value) => {
    setCell({
      ...cell,
      source: value,
    })
  }

  const Content = (
    <Grid item xs={12}>
      <Yasqe
        value={source || ''}
        onChange={onChange}
        editorRef={editorRef}
      />
    </Grid>
  )

  const result = React.useMemo(() => {
    if (!outputs?.length) {
      return null;
    }

    return cellOutputToYasgui(outputs[0]);
  }, [ outputs ]);

  const Result = useMemo(() => !!outputs?.length && (
    <Box sx={{ width: '100%' }}>
      <Yasr
        result={result}
        prefixes={prefixes}
      />
    </Box>
  ), [ outputs, prefixes ]);

  const { report } = useReportContext();
  const { templatePrompt, templateOutput } = useMemo(() => {
    const prefixes = (report.dataset?.namespaces ?? [])
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
  }, [ report.dataset ]);

  const GPTModal = useMemo(() => (
    <>
      <Fab size="small" color="secondary" sx={{
        position: 'absolute',
        right: 4,
        top: 4
      }} onClick={() => setGptPromptOpen(true)}>
        <LightbulbIcon/>
      </Fab>
      <GPTPromptModal
        open={gptPromptOpen}
        templatePrompt={templatePrompt}
        templateOutput={templateOutput}
        onClose={(result) => {
          setGptPromptOpen(false);

          if (result && result.output) {
            editorRef.current?.setValue(result.output.trim());
          }
        }}
      />
    </>
  ), [ gptPromptOpen ]);


  return (
    <>
      {Content}
      {GPTModal}
      {Result}
    </>
  )
}
