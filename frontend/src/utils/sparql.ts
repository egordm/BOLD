import { literal, namedNode, triple, variable } from "@rdfjs/data-model";
import namespace, { NamespaceBuilder } from "@rdfjs/namespace";
import { NamedNode, Variable, Term as RdfTerm } from "@rdfjs/types";
import { SparqlValue } from "@tpluscode/rdf-string";
import { sparql } from "@tpluscode/sparql-builder";
import { Quantifier } from "../components/input/QueryBuilder/types";
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

export const WDT_PREFIXES = {
  bd: namespace('http://www.bigdata.com/rdf#'),
  cc: namespace('http://creativecommons.org/ns#'),
  dct: namespace('http://purl.org/dc/terms/'),
  geo: namespace('http://www.opengis.net/ont/geosparql#'),
  hint: namespace('http://www.bigdata.com/queryHints#'),
  ontolex: namespace('http://www.w3.org/ns/lemon/ontolex#'),
  owl: namespace('http://www.w3.org/2002/07/owl#'),
  prov: namespace('http://www.w3.org/ns/prov#'),
  rdf: namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#'),
  rdfs: namespace('http://www.w3.org/2000/01/rdf-schema#'),
  schema: namespace('http://schema.org/'),
  skos: namespace('http://www.w3.org/2004/02/skos/core#'),
  xsd: namespace('http://www.w3.org/2001/XMLSchema#'),
  p: namespace('http://www.wikidata.org/prop/'),
  pq: namespace('http://www.wikidata.org/prop/qualifier/'),
  pqn: namespace('http://www.wikidata.org/prop/qualifier/value-normalized/'),
  pqv: namespace('http://www.wikidata.org/prop/qualifier/value/'),
  pr: namespace('http://www.wikidata.org/prop/reference/'),
  prn: namespace('http://www.wikidata.org/prop/reference/value-normalized/'),
  prv: namespace('http://www.wikidata.org/prop/reference/value/'),
  psv: namespace('http://www.wikidata.org/prop/statement/value/'),
  ps: namespace('http://www.wikidata.org/prop/statement/'),
  psn: namespace('http://www.wikidata.org/prop/statement/value-normalized/'),
  wd: namespace('http://www.wikidata.org/entity/'),
  wdata: namespace('http://www.wikidata.org/wiki/Special:EntityData/'),
  wdno: namespace('http://www.wikidata.org/prop/novalue/'),
  wdref: namespace('http://www.wikidata.org/reference/'),
  wds: namespace('http://www.wikidata.org/entity/statement/'),
  wdt: namespace('http://www.wikidata.org/prop/direct/'),
  wdtn: namespace('http://www.wikidata.org/prop/direct-normalized/'),
  wdv: namespace('http://www.wikidata.org/value/'),
  wikibase: namespace('http://wikiba.se/ontology#'),
}

export const PREFIXES = {
  rdf: namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#'),
  rdfs: namespace('http://www.w3.org/2000/01/rdf-schema#'),
  owl: namespace('http://www.w3.org/2002/07/owl#'),
  xsd: namespace('http://www.w3.org/2001/XMLSchema#'),
  wdt: namespace('http://www.wikidata.org/prop/direct/'),
}

export const namespacesToPrefixes = (namespaces: Record<string, NamespaceBuilder>): Record<string, string> => {
  return {
    ...Object.fromEntries(
      Object.entries(namespaces).map(([ prefix, ns ]) => [ prefix, ns().value ])
    ),
  }
}

export const extractSparqlResult = (output?: CellOutput): SPARQLResult | null => {
  if (output?.output_type === 'execute_result') {
    const contentType = Object.keys(output.data)[0];
    const data = output.data[contentType];

    if (contentType === 'application/n-triples') {
      return data;
    } else {
      return JSON.parse(data);
    }
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

export const suffix = (expr: Variable, suffix: string) => variable(`${expr.value}${suffix}`)

export const brackets = (expr: SparqlValue, curly = false) => ({
  expr,
  _toPartialString(options) {
    return curly
      ? sparql`{ ${expr} }`._toPartialString(options)
      : sparql`( ${expr} )`._toPartialString(options)
  }
})

export const bind = (expr: SparqlValue, alias: Variable | string) => ({
  expr,
  alias: typeof alias === 'string' ? variable(alias) : alias,
  _toPartialString(options) {
    return sparql`BIND( ${expr} AS ${alias} )`._toPartialString(options)
  }
})

export const valuesBound = (variable: Variable, values: RdfTerm[]) => ({
  variable,
  values,
  _toPartialString(options) {
    return sparql`VALUES ${variable} { ${values} }.`._toPartialString(options)
  }
});

export const optionalBound = (expr: SparqlValue | SparqlValue[]) => ({
  expr,
  _toPartialString(options) {
    return sparql`OPTIONAL { ${expr} }`._toPartialString(options)
  }
})

export const sparqlLabelBound = (v: Variable | string, wikidata = false) => {
  const { wikibase, rdfs } = WDT_PREFIXES;
  const varName = typeof v === 'string' ? variable(v) : v;
  const varLabel = variable(`${varName.value}Label`);

  let labelSelect;
  if (wikidata) {
    const varClaim = suffix(varName, 'Claim');
    labelSelect = sparqlConjunctionBuilder([
      brackets([
        triple(varClaim, wikibase.directClaim, varName),
        triple(varClaim, rdfs.label, varLabel),
      ], true),
      brackets([
        triple(varName, rdfs.label, varLabel)
      ], true),
    ], 'OR', 'must');
  } else {
    labelSelect = triple(varName, rdfs.label, varLabel);
  }

  const labelFilter = sparql`FILTER (BOUND(${varLabel}) && lang(${varLabel}) = "en").`;
  const bound = optionalBound([ labelSelect, labelFilter ]);

  return {
    bounds: [ bound ],
    varLabel
  }
}

export const sparqlSimpleLabelBound = (v: Variable | string) => {
  const { rdfs } = PREFIXES;
  const varName = typeof v === 'string' ? variable(v) : v;
  const varLabel = suffix(varName, 'Label');

  return {
    bounds: [
      optionalBound([
        triple(varName, rdfs.label, varLabel),
        sparql`FILTER (BOUND(${varLabel}) && lang(${varLabel}) = "en").`,
      ]),
    ],
    varLabel
  }
}

export const sparqlLabelsBound = (v: (Variable | string)[], wikidata = false) => {
  return v.reduce((acc: any, v) => {
    const { bounds, varLabel } = sparqlLabelBound(v, wikidata);
    acc.bounds.push(...bounds);
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

  if ((value as NamedNode)?.termType) {
    const { value: iriValue } = value as NamedNode;
    const iri = formatIri(iriValue, prefixes)

    return !extractLabel || iri.length < 20 ? iri : extractIriLabel(iriValue);
  }

  return value;
}

export const sparqlDTypeBound = (v: Variable | string, dtype: string) => {
  const varName = typeof v === 'string' ? variable(v) : v;

  switch (dtype) {
    case 'numeric':
      return sparql`FILTER (BOUND(${varName}) && isNumeric(${v}))`;
    case 'date': {
      const datatypeIri = [
        `<http://www.w3.org/2001/XMLSchema#date>`,
        `<http://www.w3.org/2001/XMLSchema#dateTime>`
      ];

      return sparql`
        FILTER(BOUND(${varName}) && DATATYPE(${varName}) IN (${datatypeIri.join(',')})).
        FILTER(YEAR(${varName}) > 0 && YEAR(${varName}) < 2100).
      `
    }
    case 'categorical':
    default:
      return sparql`FILTER (BOUND(${varName}))`;
  }
}

export const sparqlPrefixes = (prefixes: Prefixes | Record<string, NamespaceBuilder>) => {
  return Object.entries(prefixes)
    .map(([ prefix, iri ]) => typeof iri === 'string'
      ? `PREFIX ${prefix}: <${iri}>`
      : `PREFIX ${prefix}: <${iri.value}>`
    );
}


export const sparqlDTypeContinuize = (v: Variable | string, dtype: string) => {
  switch (dtype) {
    case 'date': {
      return sparql`(YEAR(${v}) + MONTH(${v}) / 12)`;
    }
    case 'numeric':
    case 'categorical':
    default:
      return v;
  }
}

export const sparqlDTypeContinuizeRev = (v: Variable | string, dtype: string) => {
  switch (dtype) {
    case 'date': {
      return v;
    }
    case 'numeric':
    case 'categorical':
    default:
      return v;
  }
}

export const sparqlConjunctionBuilder = (terms: SparqlValue[], combinator: 'AND' | 'OR', quantifier: Quantifier = 'must') => ({
  combinator,
  terms,
  quantifier,
  _toPartialString(options) {
    let rules = null;

    switch (combinator) {
      case 'AND': {
        rules = sparql`${sparqlJoin(terms, '\n')}`;
        break;
      }
      case 'OR': {
        rules = sparql`${sparqlJoin(terms, '\nUNION\n')}`;
        break;
      }
      default:
        throw new Error(`Unknown combinator ${combinator}`)
    }

    switch (quantifier) {
      case 'must': {
        return rules._toPartialString(options);
      }
      case 'must_not': {
        return sparql`MINUS { ${rules} }`._toPartialString(options);
      }
      case 'optional':
        return sparql`OPTIONAL { ${rules} }`._toPartialString(options);
      default:
        throw new Error(`Unknown quantifier ${quantifier}`)
    }
  }
})

export const sparqlJoin = (sparqls: SparqlValue[], separator: any) => {
  if (sparqls.length === 0) {
    return null;
  }

  const tokens = [ ...sparqls ];
  const first = tokens.shift();
  return tokens.reduce((acc, curr) => sparql`${acc} ${separator} ${curr}`, first)
}
