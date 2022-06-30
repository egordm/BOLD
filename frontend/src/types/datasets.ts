export interface Dataset {
  id: string;
  name: string;
  database: string | null;
  description: string;
  source: string;
  sparql_endpoint: string;
  creator: string;
  statistics: any;
  created_at: Date;
  updated_at: Date;

  namespaces: null | {
    prefix: string;
    name: string;
  }[]
}


export const namespacesToPrefixes = (namespaces: null | { prefix: string; name: string; }[]) => {
  return {
    ...Object.fromEntries(namespaces.map(({ prefix, name }) => [ prefix, name ])),
  }
}
