import _ from "lodash";

export const arraySum = (data: number[]): number => {
  return data.reduce((acc, value) => acc + value, 0);
}

export const arrayNormalize = (data: number[]): number[] => {
  const sum = arraySum(data);
  return data.map(value => value / sum);
}

export const arrayBinnedNormalize = <T extends string | number | symbol>(bin_assignments: T[], data: number[]): number[] => {
  const binSums: Record<T, number> = {} as any;
  _.zip(data, bin_assignments).forEach(([ value, bin ]) => {
    binSums[bin] = (binSums[bin] ?? 0) + value;
  });

  return _.zip(data, bin_assignments).map(([ value, bin ]) => value / binSums[bin]);
}

export const groupArraysBy = (groups: any[], array: any[]): Record<any, any[]> => {
  const result: Record<any, any[]> = {};
  _.zip(groups, array).forEach(([ group, value ]) => {
    result[group] = result[group] ?? [];
    result[group].push(value);
  });
  return result;
}
