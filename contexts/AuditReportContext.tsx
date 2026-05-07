"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AuditInputV1 } from "@/lib/audit/types";
import type { AuditReport } from "@/lib/audit/engine";
import { readLocalStorageJson, writeLocalStorageJson } from "@/lib/storage/localStorage";

export type StoredAuditV1 = {
  version: 1;
  input: AuditInputV1;
  report: AuditReport;
  generatedAtIso: string;
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
  const [isHydrated, setIsHydrated] = useState(false);
  const [stored, setStoredState] = useState<StoredAuditV1 | null>(null);

  useEffect(() => {
    const res = readLocalStorageJson<StoredAuditV1>(STORAGE_KEY);
    if (res.ok && res.value?.version === 1) setStoredState(res.value);
    setIsHydrated(true);
  }, []);

  const value = useMemo<AuditReportState>(() => {
    return {
      isHydrated,
      stored,
      setStored: (next) => {
        setStoredState(next);
        writeLocalStorageJson(STORAGE_KEY, next);
      },
      clear: () => {
        setStoredState(null);
        writeLocalStorageJson(STORAGE_KEY, null);
      },
    };
  }, [isHydrated, stored]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuditReport() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuditReport must be used within AuditReportProvider");
  return ctx;
}

