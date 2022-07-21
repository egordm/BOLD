import { useCallback, useEffect } from "react";
import { useCellContext } from "../providers/CellProvider";
import { WidgetCellType } from "../types/notebooks";

export const useCellWidgetData = <T, >(
  buildQuery: (data: T) => {[query: string]: string}
) => {
  const { cell, cellRef, setCell } = useCellContext();
  const { data } = cell as WidgetCellType<T>;

  useEffect(() => {
    const queries = Object.values(buildQuery(data));

    setCell({
      ...cellRef.current,
      source: queries,
    } as any)
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
