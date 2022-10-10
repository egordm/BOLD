import React, { useEffect, useMemo, useRef } from "react";
import { Dataset, legacyNamespacesToPrefixes } from "../types";
import { namespacesToPrefixes, WDT_PREFIXES } from "../utils/sparql";
import { useReportContext } from "./ReportProvider";


const DatasetContext = React.createContext<{
  dataset: Dataset | null,
  datasetRef: React.MutableRefObject<Dataset | null>,
}>(null);


export const DatasetProvider = ({
  children,
}: {
  children: React.ReactNode,
}) => {
  const { report } = useReportContext();
  const datasetRef = useRef(report?.dataset);

  useEffect(() => {
    datasetRef.current = report?.dataset;
  }, [ report?.dataset ]);

  const contextValue = useMemo(() => ({
    dataset: report?.dataset,
    datasetRef,
  }), [ report?.dataset ]);

  return (
    <DatasetContext.Provider value={contextValue}>
      {children}
    </DatasetContext.Provider>
  );
}

export const useDatasetContext = () => {
  const context = React.useContext(DatasetContext);
  if (context === null) {
    throw new Error('useContext must be used within a Provider');
  }
  return context;
};

export const usePrefixes = () => {
  const { dataset } = useDatasetContext();

  return React.useMemo(() => {
    return {
      ...legacyNamespacesToPrefixes(dataset?.namespaces),
      ...(dataset.search_mode === 'WIKIDATA'
        ? namespacesToPrefixes(WDT_PREFIXES) : {}),
    };
  }, [ dataset?.namespaces ]);
}
