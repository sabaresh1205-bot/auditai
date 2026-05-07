export function classifySupabaseMissingTable(errorMessage: string): boolean {
  const msg = errorMessage.toLowerCase();
  return (
    msg.includes("could not find the table") ||
    msg.includes("does not exist") ||
    msg.includes("relation \"public.audit_reports\" does not exist") ||
    msg.includes("relation \"public.leads\" does not exist")
  );
}

