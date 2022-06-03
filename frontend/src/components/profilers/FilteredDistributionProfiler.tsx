import { Autocomplete, Button, Card, CardHeader, Divider, TextField } from "@mui/material";
import axios from "axios";
import _ from "lodash";
import dynamic from "next/dynamic";
import React from "react";
import { TermInput } from "../input/TermInput";

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface BarPlotData {
  x: string[];
  y: number[];
}


export const FilteredDistributionProfiler = (props) => {
  const [ valProps, setValProps ] = React.useState<LabelType[]>([]);
  const [ valFilterProps, setValFilterProps ] = React.useState<Record<string, LabelType[]>>({});
  const [ valFilterVals, setValFilterVals ] = React.useState<Record<string, LabelType[]>>({});

  const [ data, setData ] = React.useState<BarPlotData>({
    x: [],
    y: []
  });

  console.log(valProps, valFilterProps);

  const onFetchData = async () => {
    const response = await axios.post(
      'http://127.0.0.1:8000/api/profile/yago/filtered_distribution',
      {
        "props": valProps.map(p => p.label),
        "filters": Object.entries(valFilterProps).map(([ k, ps ]) => {
          const vs = valFilterVals[k];

          return [
            ps.map(p => p.label),
            vs.map(v => v.label)
          ]
        }),
        "n_bins": 10
      }
    )
    const data = response.data;

    setData({
      x: data.result.map(x => x.v),
      y: data.result.map(x => x.count),
    })

    console.log(response.data)
  }


  return (
    <Card {...props}>
      <CardHeader
        title="Filtered Distribution Profiler"
      />
      <Divider/>
      <TermInput/>

      <Button size="small" variant="contained" sx={{
        mr: 2,
        minWidth: 34, borderRadius: '50%',
        padding: "6px 0px"
      }} color={'secondary'}>
        P
      </Button>

      <Autocomplete
        multiple
        disablePortal
        id="combo-box-demo"
        options={predicates}
        getOptionLabel={(option) => option.label}
        value={valProps}
        onChange={(event, newVal) => {
          setValProps(newVal as LabelType[]);
        }}
        sx={{ width: 300 }}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="standard"
            label="Group Prop"
          />
        )}
      />
      <Autocomplete
        multiple
        disablePortal
        id="combo-box-demo"
        options={predicates}
        getOptionLabel={(option) => option.label}
        value={valFilterProps['g1'] ?? []}
        onChange={(event, newVal) => {
          setValFilterProps({
            ...valFilterProps,
            g1: newVal as LabelType[]
          });
        }}
        sx={{ width: 300 }}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="standard"
            label="Filter Terms 1"
          />
        )}
      />
      <Autocomplete
        multiple
        disablePortal
        id="combo-box-demo"
        options={values}
        getOptionLabel={(option) => option.label}
        value={valFilterVals['g1'] ?? []}
        onChange={(event, newVal) => {
          setValFilterVals({
            ...valFilterVals,
            g1: newVal as LabelType[]
          });
        }}
        sx={{ width: 300 }}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="standard"
            label="Filter Values 1"
          />
        )}
      />
      <Button variant="text" onClick={onFetchData}>Submit</Button>
      <Plot
        data={[
          { type: 'bar', x: data.x, y: data.y },
        ]}
        layout={{
          height: 400,
          title: 'A Fancy Plot'
        }}
      />
    </Card>
  );
};

interface LabelType {
  label: string;
}


const predicates = [
  { label: 'http://yago-knowledge.org/resource/infobox/en/ethnicity' },
  { label: 'http://yago-knowledge.org/resource/isCitizenOf' },
];

const values = [
  { label: 'http://yago-knowledge.org/resource/United_States' },
  { label: 'http://yago-knowledge.org/resource/Germany' },
  { label: 'http://yago-knowledge.org/resource/France' },
  { label: 'http://yago-knowledge.org/resource/Russia' },
  { label: 'http://yago-knowledge.org/resource/Australia' },
];

