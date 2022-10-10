import { NamespaceBuilder } from "@rdfjs/namespace";

export interface Dataset {
  id: string;
  name: string;
  description: string;
  source: string;
  mode: 'LOCAL' | 'SPARQL';
  search_mode: 'LOCAL' | 'WIKIDATA';
  creator: string;

  local_database: string | null;
  sparql_endpoint: string;

  statistics: any;
  created_at: Date;
  updated_at: Date;

  namespaces: null | {
    prefix: string;
    name: string;
  }[]
}


export const legacyNamespacesToPrefixes = (namespaces: null | { prefix: string; name: string; }[]) => {
  return {
    ...Object.fromEntries(namespaces.map(({ prefix, name }) => [ prefix, name ])),
  }
}

