import { literal, namedNode, variable } from "@rdfjs/data-model";
import { Variable } from "@rdfjs/types";
import { SparqlValue } from "@tpluscode/rdf-string";
import { sparql } from "@tpluscode/sparql-builder";
import _ from "lodash";
import { RuleGroupType, RuleType } from "react-querybuilder/dist/types/types/ruleGroups";
import { Term } from "../../../types/terms";
import { sparqlConjunctionBuilder, sparqlJoin } from "../../../utils/sparql";
import { FlexibleTerm } from "../FlexibleTermInput";

export interface RuleGroup extends RuleGroupType<Rule> {
  variable?: {
    value: string;
    label?: string;
  }
}

export interface Rule extends RuleType {
  value: RuleValue,
}

export type RuleValue = {
  predicate: FlexibleTerm,
  input: FlexibleTerm,
  reverse: boolean,
} | string | null | any;

export interface QueryState {
  tempVarCounter: number,
  globalBounds: SparqlValue[],
}

export const tryQueryToSparql = (query: RuleGroup) => {
  const state: QueryState = {
    tempVarCounter: 0,
    globalBounds: [],
  }

  return [
    ruleGroupToSparql(state, query),
      ...state.globalBounds
  ]
}

export const queryToSparql = (query: RuleGroup) => {
  try {
    return tryQueryToSparql(query);
  } catch (e) {
    console.error(e)
    return '';
  }
}

export const partialToSparql = (state: QueryState, rule: Rule | RuleGroup, parent?: RuleGroup): SparqlValue => {
  if (!rule) {
    return null;
  }

  // @ts-ignore
  if (rule?.combinator) {
    return ruleGroupToSparql(state, rule as RuleGroup);
  } else {
    return ruleToSparql(state, rule as Rule, parent!);
  }
}

const ruleGroupToSparql = (state: QueryState, ruleGroup: RuleGroup) => {
  const combinator = (ruleGroup.combinator ?? 'AND').toUpperCase();
  const not = !!ruleGroup.not;
  const rules = ruleGroup.rules.map(rule => partialToSparql(state, rule, ruleGroup));

  const cleanedRules = [];
  for (const rule of rules) {
    if ((rule as any)?.combinator) {
      if ((rule as any)?.combinator === combinator && (rule as any)?.not === not) {
        cleanedRules.push(...(rule as any).terms);
      } else {
        cleanedRules.push(sparql`{ ${rule} }`);
      }
    } else if(_.isArray(rule)) {
      cleanedRules.push(...rule);
    } else {
      cleanedRules.push(rule);
    }
  }

  return sparqlConjunctionBuilder(cleanedRules, combinator as any, not);
}


const ruleToSparql = (state: QueryState, rule: Rule, parent: RuleGroup) => {
  switch (rule.operator) {
    case 'filter': {
      const { predicate, input, reverse } = rule.value;
      const parentVar = { type: 'variable', variable: parent.variable };
      const subject = reverse ? input : parentVar;
      const object = reverse ? parentVar : input;

      return tripleToSparql(state, subject, predicate, object);
    }
    case 'filter_path': {
      const { predicate, input, reverse } = rule.value;
      const parentVar = { type: 'variable', variable: parent.variable };
      const subject = reverse ? input : parentVar;
      const object = reverse ? parentVar : input;

      return tripleToSparql(state, subject, predicate, object);
    }
    case 'datatype': {
      const type = rule.value?.value;
      const parentVar: FlexibleTerm = { type: 'variable', variable: parent.variable };

      state.globalBounds.push(
        boundDatatypeSparql(state, parentVar, type)
      )
      return null;
    }
    default:
      throw new Error(`Unknown operator ${rule.operator}`)
  }
}


const tripleToSparql = (state: QueryState, subject: FlexibleTerm, predicate: FlexibleTerm, object: FlexibleTerm) => {
  const { varName: sVar, bounds: sBounds } = flexTermToSparql(state, subject);
  const { varName: pVar, bounds: pBounds } = flexTermToSparql(state, predicate);
  const { varName: oVar, bounds: oBounds } = flexTermToSparql(state, object);

  return [
    ...(sBounds ?? []),
    ...(pBounds ?? []),
    ...(oBounds ?? []),
    sparql`${sVar} ${pVar} ${oVar} .`,
  ]
}

const flexTermToSparql = (state: QueryState, term: FlexibleTerm) => {
  switch (term.type) {
    case 'variable': {
      if (!term.variable.value) {
        throw new Error('Variable value is required')
      }
      return {
        varName: variable(term.variable.value)
      }
    }
    case 'manual': {
      if (!term.manual) {
        throw new Error('Manual value is required')
      }
      const tokens = term.manual.split(',').map(t => t.trim())
        .map(t =>
          t.startsWith('?') ? variable(t)
            : t.startsWith("<") && t.endsWith(">") ? namedNode(t.slice(1, -1))
              : literal(t)
        );

      const varName = variable(`tmp${state.tempVarCounter++}`);
      const bounds = [
        sparql`VALUES ${varName} { ${tokens} }.`
      ];

      return { varName, bounds }
    }
    case 'search': {
      if (!term.search) {
        throw new Error('Search value is required')
      }
      const tokens = term.search.map(t => termToSparql(state, t));
      const varName = variable(`tmp${state.tempVarCounter++}`);
      const bounds = [
        sparql`VALUES ${varName} { ${tokens} }.`
      ];

      return { varName, bounds }
    }
    default:
      throw new Error(`Unknown term type ${term.type}`)
  }
}

const termToSparql = (state: QueryState, term: Term) => {
  if (term.type === 'literal') {
    return literal(term.value, term.lang ?? undefined);
  } else {
    return namedNode(term.value);
  }
}

const boundDatatypeSparql = (state: QueryState, term: FlexibleTerm, datatype: string) => {
  const { varName } = flexTermToSparql(state, term);

  if (datatype === 'null') {
    return sparql`FILTER(isBLANK(${varName})).`
  }
  if (datatype === 'non_null') {
    return sparql`FILTER(BOUND(${varName})).`
  }

  if ([ 'iri', 'url', 'literal', 'number' ].includes(datatype)) {
    let func: string;
    switch (datatype) {
      case 'iri':
        func = 'isIRI';
        break;
      case 'url':
        func = 'isURI';
        break;
      case 'literal':
        func = 'isLITERAL';
        break;
      case 'number':
        func = 'isNumeric';
        break;
      default:
        throw new Error(`Unknown datatype ${datatype}`)
    }

    return sparql`FILTER(BOUND(${varName}) && ${func}(${varName})).`
  }

  let datatypeIri = [];
  switch (datatype) {
    case 'string':
      datatypeIri = [ `<http://www.w3.org/2001/XMLSchema#string>` ];
      break;
    case 'integer':
      datatypeIri = [ `<http://www.w3.org/2001/XMLSchema#integer>` ];
      break;
    case 'boolean':
      datatypeIri = [ `<http://www.w3.org/2001/XMLSchema#boolean>` ];
      break;
    case 'datetime':
      datatypeIri = [
        `<http://www.w3.org/2001/XMLSchema#date>`,
        `<http://www.w3.org/2001/XMLSchema#dateTime>`
      ];
      break;
    case 'float':
      datatypeIri = [
        `<http://www.w3.org/2001/XMLSchema#float>`,
        `<http://www.w3.org/2001/XMLSchema#double>`,
        `<http://www.w3.org/2001/XMLSchema#decimal>`,
      ];
      break;
    default:
      throw new Error(`Unknown datatype ${datatype}`)
  }

  return sparql`FILTER(BOUND(${varName}) && DATATYPE(${varName}) IN (${datatypeIri.join(',')})).`
}

export const aggregateToSparql = (state: QueryState | null, v: Variable | SparqlValue, aggregate: string) => {
  switch (aggregate) {
    case 'COUNT':
      return sparql`COUNT(${v})`;
    case 'SUM':
      return sparql`SUM(${v})`;
    case 'AVG':
      return sparql`AVG(${v})`;
    case 'MIN':
      return sparql`MIN(${v})`;
    case 'MAX':
      return sparql`MAX(${v})`;
    case 'SAMPLE':
      return sparql`SAMPLE(${v})`;
  }
}
