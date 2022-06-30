import React, { useCallback, useEffect, useMemo } from "react";

export const CellFocusContext = React.createContext<{
  focus: string | null;
  focusRef: React.MutableRefObject<string | null>;
  setFocus: (cellId: string | null) => void;
}>(null);

export const CellFocusProvider = (props: {
  children: React.ReactNode,
}) => {
  const [ focus, setFocusInternal ] = React.useState<string | null>(null);
  const focusRef = React.useRef<string | null>(null);

  const setFocus = useCallback((cellId: string | null) => {
    setFocusInternal(cellId);
    focusRef.current = cellId;
  }, []);


  const contextValue = useMemo(() => ({
    focus, focusRef, setFocus,
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
