"use client";
import React, { createContext, useContext } from "react";
import { useSiteData } from "@/hooks/useSiteData";

type SiteDataContextType = ReturnType<typeof useSiteData>;

const SiteDataContext = createContext<SiteDataContextType | undefined>(
  undefined
);

export const SiteDataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const value = useSiteData();
  return (
    <SiteDataContext.Provider value={value}>
      {children}
    </SiteDataContext.Provider>
  );
};

export function useSiteDataContext() {
  const ctx = useContext(SiteDataContext);
  if (!ctx)
    throw new Error(
      "useSiteDataContext must be used within a SiteDataProvider"
    );
  return ctx;
}
