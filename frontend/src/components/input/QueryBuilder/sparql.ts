import { literal, namedNode, variable } from "@rdfjs/data-model";
import { SparqlValue } from "@tpluscode/rdf-string";
import { sparql } from "@tpluscode/sparql-builder";
import { RuleGroupType, RuleType } from "react-querybuilder/dist/types/types/ruleGroups";
import { Term } from "../../../types/terms";
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
  globalBound: SparqlValue[],
}

export const tryQueryToSparql = (query: RuleGroup) => {
  const state: QueryState = {
    tempVarCounter: 0,
    globalBound: [],
  }

  return sparql`
    ${ruleGroupToSparql(state, query)}
    ${state.globalBound}
    `
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
    console.log(rule, 'rule')
    return ruleGroupToSparql(state, rule as RuleGroup);
  } else {
    return ruleToSparql(state, rule as Rule, parent!);
  }
}

const ruleGroupToSparql = (state: QueryState, ruleGroup: RuleGroup) => {
  const combinator = (ruleGroup.combinator ?? 'and').toUpperCase();
  const not = !!ruleGroup.not;
  const rules = ruleGroup.rules.map(rule => sparql`{ ${partialToSparql(state, rule, ruleGroup)} }`);

  switch (combinator) {
    case 'AND':
      return not
        ? sparql`MINUS { ${sparqlJoin(rules, '\n')} }`
        : sparql`${sparqlJoin(rules, '\n')}`;
    case 'OR':
      return not
        ? sparql`MINUS { ${sparqlJoin(rules, '\nUNION\n')} }`
        : sparql`${sparqlJoin(rules, '\nUNION\n')}`;
    default:
      throw new Error(`Unknown combinator ${combinator}`)
  }
}

const sparqlJoin = (sparqls: SparqlValue[], separator: any) => {
  if (sparqls.length === 0) {
    return null;
  }

  const first = sparqls.shift();
  return sparqls.reduce((acc, curr) => sparql`${acc} ${separator} ${curr}`, first)
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

      state.globalBound.push(
        boundDatatypeSparql(state, parentVar, type)
      )
      return null;
    }
    default:
      throw new Error(`Unknown operator ${rule.operator}`)
  }
}


const tripleToSparql = (state: QueryState, subject: FlexibleTerm, predicate: FlexibleTerm, object: FlexibleTerm) => {
  const { varName: sVar, bound: sBound } = flexTermToSparql(state, subject);
  const { varName: pVar, bound: pBound } = flexTermToSparql(state, predicate);
  const { varName: oVar, bound: oBound } = flexTermToSparql(state, object);

  return sparql`
    ${sBound}
    ${pBound}
    ${oBound}
    ${sVar} ${pVar} ${oVar}
  `
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
      const bound = sparql`VALUES ${varName} { ${tokens} }`;

      return { varName, bound }
    }
    case 'search': {
      if (!term.search) {
        throw new Error('Search value is required')
      }
      const tokens = term.search.map(t => termToSparql(state, t));
      const varName = variable(`tmp${state.tempVarCounter++}`);
      const bound = sparql`VALUES ${varName} { ${tokens} }`;

      return { varName, bound }
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

  if ([ 'iri', 'url', 'literal' ].includes(datatype)) {
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
    case 'number':
      datatypeIri = [
        `<http://www.w3.org/2001/XMLSchema#integer>`,
        `<http://www.w3.org/2001/XMLSchema#float>`,
        `<http://www.w3.org/2001/XMLSchema#double>`,
        `<http://www.w3.org/2001/XMLSchema#decimal>`,
        `<http://www.w3.org/2001/XMLSchema#long>`,
      ];
      break;
    default:
      throw new Error(`Unknown datatype ${datatype}`)
  }

  return sparql`FILTER(BOUND(${varName}) && DATATYPE(${varName}) IN (${datatypeIri.join(',')})).`
}
