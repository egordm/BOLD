import { literal, namedNode, variable } from "@rdfjs/data-model";
import namespace from "@rdfjs/namespace";
import { sparql } from "@tpluscode/sparql-builder";
import { CellErrorOutput, CellOutput } from "../types/notebooks";
import { Term } from "../types/terms";

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


export const extractSparqlResult = (output?: CellOutput) => {
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

