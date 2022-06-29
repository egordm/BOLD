export type TermPos = 'SUBJECT' | 'PREDICATE' | 'OBJECT';

export interface Term {
  type: 'uri' | 'literal';
  value: string;
  lang: string | null;
  pos: TermPos;
  rdf_type: string | null;
  label: string | null;
  count: number;
}


export interface SearchResult<T> {
  count: number;
  hits: readonly {
    score: number;
    document: T;
  }[];
}
