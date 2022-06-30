export interface SparQLResult {
  head: {
    vars: string[];
  },
  results: {
    bindings: {
      [key: string]: {
        type: string;
        value: string;
        datatype?: string;
        [key: string]: any;
      }
    }[]
  }
}
