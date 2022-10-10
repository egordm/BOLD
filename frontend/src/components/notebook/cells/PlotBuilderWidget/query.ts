import { literal, variable } from "@rdfjs/data-model";
import { Variable } from "@rdfjs/types";
import { SparqlValue } from "@tpluscode/rdf-string";
import { SELECT, sparql } from "@tpluscode/sparql-builder";
import _ from "lodash";
import {
  alias,
  bind,
  brackets,
  sparqlDTypeBound,
  sparqlDTypeContinuize, sparqlDTypeContinuizeRev,
  sparqlLabelsBound, suffix
} from "../../../../utils/sparql";
import { aggregateToSparql, queryToSparql } from "../../../input/QueryBuilder/sparql";
import { PlotBuilderData, RESULT_SUFFIX } from "./types";

export const buildQuery = (data: PlotBuilderData) => {
  const x_vars: Variable[] = (data.x?.vars ?? []).map(v => variable(v.value));
  const y_vars: Variable[] = (data.y?.vars ?? []).map(v => variable(v.value));
  const z_vars: Variable[] = (data?.xy_only ?? true) ? [] : (data.z?.vars ?? []).map(v => variable(v.value));

  const xy_only = data?.xy_only ?? true;
  if (!x_vars.length || !y_vars.length || (!xy_only && !z_vars.length)) {
    // return {};
    throw new Error('No variables selected');
  }

  const y_aggregate = data.y?.aggregate ?? 'COUNT';

  const { bounds: labelBounds, vars: labelVars } = sparqlLabelsBound([ ...x_vars, ...z_vars ]);

  const xBound = x_vars.map(v => sparqlDTypeBound(v, data.x?.dtype));
  const zBound = z_vars.map(v => sparqlDTypeBound(v, data.z?.dtype));
  const yBound = y_aggregate === 'COUNT' ? null : y_vars.map(v => sparqlDTypeBound(v, 'numeric'));

  const body = queryToSparql(data.tree);
  const queryBody = sparql`
      ${body}
      ${xBound}
      ${zBound}
      ${yBound}
  `
  const { bounds: xBoundsD, vars: xVarsD } = sparqlDiscretize(
    x_vars, data.x?.dtype, queryBody, data.max_groups_x ?? 20,
  );
  const xVarsSelect = _.zip(x_vars, xVarsD).map(([v, d]) => alias(d, suffix(v, RESULT_SUFFIX)));
  const { bounds: zBoundsD, vars: zVarsD } = sparqlDiscretize(
    z_vars, data.z?.dtype, queryBody, data.max_groups_z ?? 20,
  );
  const zVarsSelect = _.zip(z_vars, zVarsD).map(([v, d]) => alias(d, suffix(v, RESULT_SUFFIX)));

  const aggregatedVars = y_vars.map(v => alias(aggregateToSparql(null, v, y_aggregate), suffix(v, RESULT_SUFFIX)));
  const aggregatedLabelVars = labelVars.map(v => alias(aggregateToSparql(null, v, "SAMPLE"), suffix(v, RESULT_SUFFIX)));
  const selectVars = [ ...xVarsSelect, ...aggregatedVars, ...zVarsSelect, ...aggregatedLabelVars ];

  let primaryQuery = SELECT`${selectVars}`
    .WHERE`
      ${queryBody}
      ${xBoundsD}
      ${zBoundsD}
      ${labelBounds}
    `
    .LIMIT(data.xy_only
      ? (data.max_groups_x ?? 20)
      : (data.max_groups_x ?? 20) * (data.max_groups_z ?? 20)
    );

  const groupVars = [ ...xVarsD, ...zVarsD ];
  const groupFirst = groupVars.shift();
  primaryQuery = groupVars.reduce(
    (query, varName) => query.THEN.BY(varName),
    primaryQuery.GROUP().BY(groupFirst)
  );

  const orderVars = y_vars.map(v => brackets(aggregateToSparql(null, v, y_aggregate)));
  const orderFirst = orderVars.shift();
  primaryQuery = orderVars.reduce(
    (query, varName) => query.THEN.BY(varName as any),
    primaryQuery.ORDER().BY(orderFirst as any, true)
  );

  return {
    primaryQuery: primaryQuery.build(),
  };
}


export const sparqlDiscretize = (
  vars: Variable[],
  dtype: string,
  body: SparqlValue,
  bins: number,
) => {
  if (dtype === 'categorical' || vars.length === 0) {
    return {
      bounds: [],
      vars: vars,
    }
  }

  const continueVars = [];
  for (const v of vars) {
    continueVars.push(sparql`(MIN(${sparqlDTypeContinuize(v, dtype)}) AS ?${v.value}Min)`);
    continueVars.push(sparql`(MAX(${sparqlDTypeContinuize(v, dtype)}) AS ?${v.value}Max)`);
  }

  const queryMinMax = sparql`{ SELECT ${continueVars} WHERE { ${body} } }`;;

  const resultVars = [];
  const bounds: any[] = [queryMinMax];

  for (const v of vars) {
    const stepVar = variable(`${v.value}Step`);
    const stepBound = bind(sparql`((?${v.value}Max - ?${v.value}Min) / ${bins})`, stepVar);
    const continueVar = variable(`${v.value}Continue`);
    const continueBound = bind(sparqlDTypeContinuize(v, dtype), continueVar);
    const discreteVar = variable(`${v.value}Discrete`);
    const discreteBound = bind(
      sparql`(0.5 + xsd:integer((${continueVar} - ?${v.value}Min) / ${stepVar})) * ${stepVar} + ?${v.value}Min`,
      discreteVar
    );
    const resultVar = variable(`${v.value}Result`);
    const resultBound = bind(
      sparqlDTypeContinuizeRev(discreteVar, dtype),
      resultVar,
    )

    resultVars.push(resultVar);
    bounds.push(stepBound, continueBound, discreteBound, resultBound);
  }

  return {
    bounds,
    vars: resultVars,
  }
}
