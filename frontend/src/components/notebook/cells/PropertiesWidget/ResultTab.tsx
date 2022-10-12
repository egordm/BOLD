import { alpha, styled } from '@mui/material/styles';
import { Box, Link } from "@mui/material";
import { DataGrid, GridColDef, gridClasses } from "@mui/x-data-grid";
import { variable } from "@rdfjs/data-model";
import React, { useMemo } from "react";
import { usePrefixes } from "../../../../providers/DatasetProvider";
import { Cell, CellOutput } from "../../../../types/notebooks";
import { validImageUrl, validURL } from "../../../../utils/formatting";
import { extractSparqlResult, sparqlParseValue, sparqlPrettyPrint, suffix } from "../../../../utils/sparql";
import { cellOutputToYasgui } from "../../../../utils/yasgui";
import { Yasr } from "../../../data/Yasr";

const columns: GridColDef[] = [
  {
    flex: 1,
    field: 'p',
    headerName: 'Property',
    renderCell: (params) => validURL(params.value.value) ? (
      <Link
        href={params.value.value}
        target="_blank">{params.value.label}</Link>
    ) : params.value.label,
    sortComparator: (v1, v2, param1, param2) => {
      return param1.value.label.localeCompare(param2.value.label);
    }
  },
  {
    flex: 1,
    field: 'o',
    headerName: 'Value',
    renderCell: (params) =>
      validImageUrl(params.value.value)
        ? (
          <Box
            component="img"
            sx={{
              maxHeight: { xs: 240, md: 240 },
              maxWidth: { xs: 240, md: 240 },
            }}
            alt={params.value.label}
            src={params.value.value.toString()}
          />
        )
        : validURL(params.value.value)
          ? (<Link href={params.value.value.toString()} target="_blank">{params.value.label}</Link>)
          : params.value.label.toString(),
  }
];


export const ResultTab = ({
  mode, cell, outputs
}: {
  mode: string,
  cell: Cell,
  outputs: CellOutput[] | null
}) => {
  const prefixes = usePrefixes();

  const propsData = useMemo(() => {
    const result = extractSparqlResult(outputs[0]);
    if (!result) return null;

    const cols = [ variable('p'), variable('o') ];
    const rows = result.results.bindings.map((row, i) => {
      const res = {
        id: i,
      };
      for (const col of cols) {
        res[col.value] = {
          label: sparqlPrettyPrint(
            sparqlParseValue(row[col.value]),
            sparqlParseValue(row[suffix(col, 'Label').value]),
            prefixes,
            false,
          ),
          value: row[col.value]?.value,
        }
      }

      return res;
    });

    return { rows };
  }, [ outputs ]);

  if (mode === 'properties' && propsData) {
    const { rows } = propsData;

    return (
      <Box sx={{ width: '100%', height: 400 }}>
        <DataGrid
          density="compact"
          checkboxSelection={false}
          rows={rows}
          columns={columns}
          getRowHeight={() => 'auto'}
          autoPageSize={true}
          initialState={{
            sorting: {
              sortModel: [{ field: 'p', sort: 'asc' }],
            },
          }}
        />
      </Box>
    )
  } else {
    return (<Yasr
      result={cellOutputToYasgui(outputs[0])}
      prefixes={prefixes}
    />)
  }
}
