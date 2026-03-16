'use client';

import { createContext, useContext, useState, useCallback } from 'react';

type BreadcrumbContextType = {
  dynamicLabels: Record<string, string>;
  setLabel: (segment: string, label: string) => void;
};

export const BreadcrumbContext = createContext<BreadcrumbContextType>({
  dynamicLabels: {},
  setLabel: () => {},
});

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [dynamicLabels, setDynamicLabels] = useState<Record<string, string>>({});

  const setLabel = useCallback((segment: string, label: string) => {
    setDynamicLabels((prev) => {
      if (prev[segment] === label) return prev;
      return { ...prev, [segment]: label };
    });
  }, []);

  return (
    <BreadcrumbContext.Provider value={{ dynamicLabels, setLabel }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  return useContext(BreadcrumbContext);
}
