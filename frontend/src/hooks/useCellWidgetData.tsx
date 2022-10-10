import _ from "lodash";
import { useCallback, useEffect } from "react";
import { useCellContext } from "../providers/CellProvider";
import { useDatasetContext } from "../providers/DatasetProvider";
import { Dataset } from "../types";
import { WidgetCellType } from "../types/notebooks";
import useNotification from "./useNotification";

export const useCellWidgetData = <T, >(
  buildQuery: (data: T, dataset?: Dataset) => {[query: string]: string}
) => {
  const { cell, cellRef, setCell } = useCellContext();
  const { data } = cell as WidgetCellType<T>;
  const { datasetRef } = useDatasetContext();

  const { sendNotification } = useNotification();

  const updateSource = useCallback(_.throttle((data) => {
    try {
      const queries = Object.values(buildQuery(data, datasetRef.current));

      setCell({
        ...cellRef.current,
        source: queries,
      } as any)
    } catch (e) {
      console.error(e);
      sendNotification({
        message: `Error building query: ${e.message}`,
        variant: 'error',
      });
    }
  }, 500), [buildQuery, cellRef]);

  useEffect(() => {
    updateSource(data);
  }, [ data ]);

  const setData = useCallback((newData: Partial<T>) => {
    const cell = cellRef.current as WidgetCellType<T>;

    setCell({
      ...cell,
      data: { ...cell.data, ...newData }
    } as any)
  }, [])

  return {
    setData,
  }
}
