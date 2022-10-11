import { triple, variable } from "@rdfjs/data-model";
import { SELECT, sparql } from "@tpluscode/sparql-builder";
import { Dataset } from "../../../../types";
import { sparqlLabelBound } from "../../../../utils/sparql";
import { flexTermToSparql, QueryState } from "../../../input/QueryBuilder/sparql";
import { PropertiesWidgetData } from "./types";

export const buildQuery = (data: PropertiesWidgetData, dataset: Dataset) => {
  if (!data?.subject) {
    return null;
  }

  const state: QueryState = {
    globalBounds: [],
    tempVarCounter: 0,
    statements: new Set(),
    wikidata: dataset.search_mode === 'WIKIDATA',
  };

  const { varName: sVar, bounds: sBounds } = flexTermToSparql(state, data.subject);

  const pVar = variable('p');
  const { bounds: pLabelBounds, varLabel: pVarLabel } = sparqlLabelBound(pVar);

  const oVar = variable('o');
  const { bounds: oLabelBounds, varLabel: oVarLabel } = sparqlLabelBound(oVar);

  const selectVars = [pVar, pVarLabel, oVar, oVarLabel];
  const bounds = [
    ...sBounds,
    triple(sVar, pVar, oVar),
    sparql`FILTER(!isLiteral(${oVar}) || langMatches(lang(${oVar}), "en") || langMatches(lang(${oVar}), ""))`,
    ...pLabelBounds, ...oLabelBounds,
  ];

  const primaryQuery = SELECT`${selectVars}`
    .WHERE`${bounds}`
    .LIMIT(data.limit ?? 20);

  return {
    primaryQuery: primaryQuery.build(),
  };
}
