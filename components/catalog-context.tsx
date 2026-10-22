"use client";

import { createContext, useContext } from "react";
import type { Catalog } from "@/lib/types";

const CatalogContext = createContext<Catalog | null>(null);

export function CatalogProvider({ catalog, children }: { catalog: Catalog; children: React.ReactNode }) {
  return <CatalogContext.Provider value={catalog}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const catalog = useContext(CatalogContext);
  if (!catalog) throw new Error("Catalog is not available.");
  return catalog;
}
