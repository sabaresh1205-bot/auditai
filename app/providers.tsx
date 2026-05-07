"use client";

import { AuditReportProvider } from "@/contexts/AuditReportContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AuditReportProvider>{children}</AuditReportProvider>;
}

