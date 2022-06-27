import React, { useCallback, useMemo } from "react";
import { useMutation, useQuery } from "react-query";
import useNotification from "../hooks/useNotification";
import { Report } from "../types/reports";
import { apiClient } from "../utils/api";


const ReportContext = React.createContext<{
  report: Report | null,
  save: (report: Report) => void,
  isSaving: boolean,
  refetch: () => void,
  isFetching: boolean,
}>(null);


export const ReportProvider = (props: {
  reportId: string,
  children: React.ReactNode,
}) => {
  const { sendNotification } = useNotification();

  const { reportId, children, } = props;
  const [ report, setReportInternal ] = React.useState<Report | null>(null);
  const reportRef = React.useRef<Report | null>(null);

  const setReport = useCallback((report: Report) => {
    setReportInternal(report);
    reportRef.current = report;
  }, []);

  const { refetch, isFetching } = useQuery([ 'report', reportId ], async () => {
    const response = await apiClient.get<Report>(`/reports/${reportId}/`);
    return response.data;
  }, {
    onSuccess: (data) => {
      console.debug('Fetched report', data);
      setReport(data);
    },
    onError: (err) => {
      sendNotification({ variant: 'error', message: `Failed to fetch report` });
    }
  });

  const { mutate: saveInternal, isLoading: isSaving } = useMutation(async () => {
    const response = await apiClient.put<Report>(`/reports/${reportId}/`, { ...reportRef.current });
    return response.data;
  }, {
    onSuccess: (output) => {
      console.debug('Saved report', output);
      setReport(output);
    },
    onError: (err) => {
      sendNotification({ variant: 'error', message: `Failed to save notebook` });
    },
  })

  const save = (report: Report) => {
    sendNotification({ variant: 'info', message: `Saving report` });
    setReport(report);
    saveInternal();
  }

  const contextValue = useMemo(() => ({
    report, setReport, save, isSaving, refetch, isFetching,
  }), [ report, isSaving, isFetching ]);

  return (
    <ReportContext.Provider value={contextValue}>
      {children}
    </ReportContext.Provider>
  );
}

export const useReportContext = () => {
  const context = React.useContext(ReportContext);
  if (context === null) {
    throw new Error('useContext must be used within a Provider');
  }
  return context;
};
