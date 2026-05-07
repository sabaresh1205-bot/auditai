export type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

export type LeadInsert = {
  email: string;
  company_name?: string | null;
  role?: string | null;
  team_size?: number | null;
};

export type AuditReportInsert = {
  report_data: JsonValue;
  input_data: JsonValue;
  is_public?: boolean;
  total_monthly_savings: number;
  total_annual_savings: number;
};

export type PublicAuditReportRow = {
  id: string;
  report_data: JsonValue;
  input_data: JsonValue;
  is_public: boolean;
  total_monthly_savings: number;
  total_annual_savings: number;
  created_at: string;
};

