import { literal, namedNode, variable } from "@rdfjs/data-model";
import namespace from "@rdfjs/namespace";
import { NamedNode, Variable } from "@rdfjs/types";
import { SparqlValue } from "@tpluscode/rdf-string";
import { sparql } from "@tpluscode/sparql-builder";
import { CellOutput } from "../types/notebooks";
import { SPARQLValue, SPARQLResult, Prefixes } from "../types/sparql";
import { Term } from "../types/terms";
import { extractIriLabel, formatIri } from "./formatting";

export const termToSparql = (term: Term) => {
  if (term.type === 'literal') {
    return literal(term.value, term.lang ?? undefined);
  } else {
    return namedNode(term.value);
  }
}


export const PREFIXES = {
  rdf: namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#'),
  rdfs: namespace('http://www.w3.org/2000/01/rdf-schema#'),
  owl: namespace('http://www.w3.org/2002/07/owl#'),
  xsd: namespace('http://www.w3.org/2001/XMLSchema#'),
}


export const extractSparqlResult = (output?: CellOutput): SPARQLResult | null => {
  if (output?.output_type === 'execute_result') {
    const contentType = Object.keys(output.data)[0];
    const data = output.data[contentType];

    return JSON.parse(data);
  }

  return null;
}

export const querySparqlLabel = (variable: string) => {
  const { rdfs } = PREFIXES;

  return sparql`OPTIONAL { ?${variable} ${rdfs.label} ?${variable}Label filter (lang(?${variable}Label) = "en"). }`
}

export const alias = (expr: SparqlValue, alias: Variable | string) => ({
  expr,
  alias: typeof alias === 'string' ? variable(alias) : alias,
  _toPartialString(options) {
    return sparql`( ${expr} AS ${alias} )`._toPartialString(options)
  }
})

export const brackets = (expr: SparqlValue) => ({
  expr,
  _toPartialString(options) {
    return sparql`( ${expr} )`._toPartialString(options)
  }
})

export const sparqlLabelBound = (v: Variable | string) => {
  const { rdfs } = PREFIXES;
  const varName = typeof v === 'string' ? variable(v) : v;
  const varLabel = variable(`${varName.value}Label`);

  return {
    bound: sparql`OPTIONAL { ${varName} ${rdfs.label} ${varLabel} FILTER (BOUND(${varLabel}) && lang(${varLabel}) = "en"). }`,
    varLabel
  }
}


export const sparqlLabelsBound = (v: (Variable | string)[]) => {
  return v.reduce((acc: any, v) => {
    const { bound, varLabel } = sparqlLabelBound(v);
    acc.bounds.push(bound);
    acc.vars.push(varLabel);
    return acc;
  }, { bounds: [], vars: [] })
}

export type SPARQLParsedValue = NamedNode | string | number | boolean | Date | null | undefined;

export const sparqlParseValue = (v: SPARQLValue | undefined) => {
  if (!v) {
    return undefined;
  }
  const { type, datatype, value } = v;

  if (type === 'uri') {
    return namedNode(value);
  } else if (type === 'literal') {
    switch (datatype) {
      case 'http://www.w3.org/2001/XMLSchema#integer':
      case 'http://www.w3.org/2001/XMLSchema#long':
        return parseInt(value, 10);
      case 'http://www.w3.org/2001/XMLSchema#decimal':
      case 'http://www.w3.org/2001/XMLSchema#double':
      case 'http://www.w3.org/2001/XMLSchema#float':
        return parseFloat(value);
      case 'http://www.w3.org/2001/XMLSchema#boolean':
        return value === 'true';
      case 'http://www.w3.org/2001/XMLSchema#dateTime':
      case 'http://www.w3.org/2001/XMLSchema#date':
        return new Date(value);
      default:
        return value;
    }
  } else {
    throw new Error(`Unknown type ${type}`);
  }
}

export type SPARQLResultTransposed = Record<string, SPARQLValue[]>;

export const sparqlTransposeResult = ({
  head: { vars },
  results: { bindings }
}: SPARQLResult): SPARQLResultTransposed => {
  const columns: SPARQLResultTransposed = {};
  for (const v of vars) {
    columns[v] = [];
  }

  for (const binding of bindings) {
    for (const v of vars) {
      columns[v].push(binding[v]);
    }
  }

  return columns;
}

export const sparqlPrettyPrint = (
  value: SPARQLParsedValue,
  label: SPARQLParsedValue,
  prefixes: Prefixes,
  extractLabel = true
): SPARQLParsedValue => {
  if (label) {
    return label;
  }

  if ((value as NamedNode).termType) {
    const { value: iriValue } = value as NamedNode;
    const iri = formatIri(iriValue, prefixes)

    return !extractLabel || iri.length < 20 ? iri : extractIriLabel(iriValue);
  }

  return value;
}

