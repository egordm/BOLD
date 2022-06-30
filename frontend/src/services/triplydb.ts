import axios from "axios";
import { useQuery } from "react-query";

export interface TDBDataset {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  avatarUrl: string;
  owner: TDBUser;
  accessLevel: string;
  license: string;
  createdAt: string;
  updatedAt: string;
  graphCount: number;
  statements: number;
  serviceCount: number;
  assetCount: number;
  topics: TDBTopic[];
  prefixes: TDBPrefix[];
  implicitTopics: TDBTopic[];
  lastGraphsUpdateTime: string;
  exampleResources: string[];
}

export interface TDBUser {
  avatarUrl: string;
  accountName: string;
  uid: string;
  name: string;
}

export interface TDBTopic {
  id: string;
  iri: string;
  label: string;
  description: string;
  parent: string;
}

export interface TDBPrefix {
  prefixLabel: string;
  iri: string;
  scope: string;
}


export const useTDBDatasets = (q: string, limit: number) => useQuery([ 'tdb-datasets', q, limit ], async () => {
  const params = q ? { q } : {};

  const result = await axios.get<TDBDataset[]>('https://api.triplydb.com/datasets', {
    params: {
      ...params,
      limit,
    },
  });
  return result.data;
});
