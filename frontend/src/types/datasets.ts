export interface Dataset {
  id: string;
  name: string;
  database: string | null;
  description: string;
  source: string;
  sparql_endpoint: string;
  creator: string;
  statistics: any;
}
