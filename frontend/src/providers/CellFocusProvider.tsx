import React, { useCallback, useEffect, useMemo } from "react";

export const CellFocusContext = React.createContext<{
  focus: string | null;
  setFocus: (cellId: string | null) => void;
}>(null);

export const CellFocusProvider = (props: {
  children: React.ReactNode,
}) => {
  const [ focus, setFocus ] = React.useState<string | null>(null);

  const contextValue = useMemo(() => ({
    focus, setFocus,
  }), [ focus ]);

  return (
    <CellFocusContext.Provider value={contextValue}>
        {props.children}
    </CellFocusContext.Provider>
  );
}

export const useCellFocusContext = () => {
  const context = React.useContext(CellFocusContext);
  if (context === null) {
    throw new Error('useContext must be used within a Provider');
  }
  return context;
};
