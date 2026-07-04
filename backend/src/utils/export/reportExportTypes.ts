export const REPORT_EXPORT_FORMATS = ["pdf", "xlsx"] as const;
export type ReportExportFormat = (typeof REPORT_EXPORT_FORMATS)[number];

export type ReportCellValue = string | number | boolean | Date | null;
export type ReportColumnType = "text" | "number" | "currency" | "date";

export type ReportExportColumn = {
  key: string;
  label: string;
  type?: ReportColumnType;
  width?: number;
};

export type ReportExportDocument = {
  reportType: string;
  title: string;
  salonName: string;
  branchName: string;
  timezone: string;
  generatedAt: Date;
  filters: Record<string, string>;
  columns: ReportExportColumn[];
  rows: Record<string, ReportCellValue>[];
  totals?: Record<string, ReportCellValue>;
};

export const MAX_EXPORT_ROWS = 10_000;
