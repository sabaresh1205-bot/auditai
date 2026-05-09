"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import type { AuditInputV1 } from "@/lib/audit/types";
import type { AuditReport } from "@/lib/audit/engine";
import { useSessionStorageJson } from "@/lib/storage/useSessionStorageJson";

export type StoredAuditV1 = {
  version: 1;
  input: AuditInputV1;
  report: AuditReport;
  generatedAtIso: string;
  persistedReportId?: string;
};

const STORAGE_KEY = "auditai:auditReport:v1";

type AuditReportState = {
  isHydrated: boolean;
  stored: StoredAuditV1 | null;
  setStored: (next: StoredAuditV1) => void;
  clear: () => void;
};

const Ctx = createContext<AuditReportState | null>(null);

export function AuditReportProvider({ children }: { children: React.ReactNode }) {
  const { value: stored, setValue: setStoredState, clearValue } =
    useSessionStorageJson<StoredAuditV1 | null>(STORAGE_KEY, null);
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const value = useMemo<AuditReportState>(() => {
    return {
      isHydrated,
      stored,
      setStored: (next) => {
        setStoredState(next);
      },
      clear: () => {
        clearValue();
      },
    };
  }, [isHydrated, stored, setStoredState, clearValue]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuditReport() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuditReport must be used within AuditReportProvider");
  return ctx;
}

