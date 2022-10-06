import _ from "lodash";

export const arraySum = (data: number[]): number => {
  return data.reduce((acc, value) => acc + value, 0);
}

export const arrayNormalize = (data: number[]): number[] => {
  const sum = arraySum(data);
  return data.map(value => value / sum);
}

export const arrayBinnedNormalize = <T extends string | number | symbol>(data: number[], bin_assignments: T[]): number[] => {
  const binSums: Record<T, number> = {} as any;
  _.zip(data, bin_assignments).forEach(([ value, bin ]) => {
    binSums[bin] = (binSums[bin] ?? 0) + value;
  });

  return _.zip(data, bin_assignments).map(([ value, bin ]) => value / binSums[bin]);
}
