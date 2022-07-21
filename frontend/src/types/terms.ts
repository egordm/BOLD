export type TermPos = 'SUBJECT' | 'PREDICATE' | 'OBJECT';

export interface Term {
  type: 'uri' | 'literal';
  search_text: string;
  value: string;
  pos: TermPos;
  lang: string | null;
  rdf_type: string | null;
  label: string | null;
  description: string | null;
  count: number| null;
  range: number | null;
}


export interface SearchResult<T> {
  count: number;
  hits: readonly {
    score: number;
    document: T;
  }[];
}
