import { variable } from "@rdfjs/data-model";
import { SELECT } from "@tpluscode/sparql-builder";
import { Dataset } from "../../../../types";
import { sparqlLabelsBound } from "../../../../utils/sparql";
import { queryToSparql } from "../../../input/QueryBuilder/sparql";
import { QueryBuilderData } from "./types";


export const buildQuery = (data: QueryBuilderData, dataset: Dataset) => {
  const vars = (data.select ?? []).map(v => variable(v.value));
  if (!vars.length) {
    return {};
    // throw new Error('No variables selected');
  }

  const { bounds: labelBounds, vars: labelVars } = sparqlLabelsBound(vars);
  const selectVars = [ ...vars, ...labelVars ];

  const body = queryToSparql(data.tree, dataset.search_mode === 'WIKIDATA');
  const query = SELECT`${selectVars}`
    .WHERE`
      ${body}
      ${labelBounds}
    `
    .LIMIT(data.limit ?? 20);

  return {
    primaryQuery: query.build(),
  };
}
