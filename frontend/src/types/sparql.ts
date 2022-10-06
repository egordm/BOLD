export interface SPARQLResult {
  head: {
    vars: string[];
  },
  results: {
    bindings: SPARQLBinding[]
  }
}

export interface SPARQLBinding {
  [key: string]: SPARQLValue
}

export interface SPARQLValue {
  type: string;
  value: string;
  datatype?: string;
  [key: string]: any;
}

export type Prefixes = Record<string, string>;
