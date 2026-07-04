import ExcelJS from "exceljs";
import type {
  ReportCellValue,
  ReportExportDocument,
} from "./reportExportTypes.js";

const excelValue = (value: ReportCellValue): ExcelJS.CellValue =>
  value === null ? "" : value;

export const createExcelReport = async (report: ReportExportDocument) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Salon Management";
  workbook.created = report.generatedAt;
  const sheet = workbook.addWorksheet("Report", {
    views: [{ state: "frozen", ySplit: 6, showGridLines: false }],
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 },
  });
  const lastColumn = Math.max(report.columns.length, 1);
  sheet.mergeCells(1, 1, 1, lastColumn);
  const title = sheet.getCell(1, 1);
  title.value = report.title;
  title.font = { bold: true, size: 18, color: { argb: "FFFFFFFF" } };
  title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4355B9" } };
  title.alignment = { vertical: "middle" };
  sheet.getRow(1).height = 30;

  sheet.getCell(2, 1).value = `Salon: ${report.salonName}`;
  sheet.getCell(3, 1).value = `Branch: ${report.branchName}`;
  sheet.getCell(4, 1).value = `Generated: ${new Intl.DateTimeFormat("en-IN", {
    timeZone: report.timezone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(report.generatedAt)}`;
  sheet.getCell(5, 1).value = `Filters: ${
    Object.entries(report.filters).map(([key, value]) => `${key}: ${value}`).join(" | ") || "None"
  }`;
  sheet.mergeCells(2, 1, 2, lastColumn);
  sheet.mergeCells(3, 1, 3, lastColumn);
  sheet.mergeCells(4, 1, 4, lastColumn);
  sheet.mergeCells(5, 1, 5, lastColumn);

  const header = sheet.getRow(6);
  report.columns.forEach((column, index) => {
    const cell = header.getCell(index + 1);
    cell.value = column.label;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF6576FF" } };
    cell.alignment = { vertical: "middle" };
  });
  header.height = 24;

  for (const row of report.rows) {
    const excelRow = sheet.addRow(
      report.columns.map((column) => excelValue(row[column.key] ?? null))
    );
    report.columns.forEach((column, index) => {
      const cell = excelRow.getCell(index + 1);
      if (column.type === "currency") cell.numFmt = '"INR" #,##0.00';
      if (column.type === "number") cell.numFmt = "#,##0.00";
      if (column.type === "date") cell.numFmt = "yyyy-mm-dd hh:mm";
    });
  }

  if (report.totals) {
    const totalRow = sheet.addRow(
      report.columns.map((column) => excelValue(report.totals?.[column.key] ?? null))
    );
    totalRow.font = { bold: true };
    totalRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E9FF" } };
      cell.border = { top: { style: "thin", color: { argb: "FF6576FF" } } };
    });
    report.columns.forEach((column, index) => {
      const cell = totalRow.getCell(index + 1);
      if (column.type === "currency") cell.numFmt = '"INR" #,##0.00';
      if (column.type === "number") cell.numFmt = "#,##0.00";
    });
  }

  report.columns.forEach((column, index) => {
    const values = [column.label, ...report.rows.map((row) => String(row[column.key] ?? ""))];
    sheet.getColumn(index + 1).width = Math.min(
      column.width ?? Math.max(12, ...values.map((value) => value.length + 2)),
      42
    );
  });
  sheet.autoFilter = { from: { row: 6, column: 1 }, to: { row: 6, column: lastColumn } };
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};
