import PDFDocument from "pdfkit";
import type {
  ReportCellValue,
  ReportExportDocument,
} from "./reportExportTypes.js";

const display = (
  value: ReportCellValue,
  type: string | undefined,
  timezone: string
) => {
  if (value === null) return "";
  if (value instanceof Date) {
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: timezone,
      dateStyle: "medium",
      timeStyle: "short",
    }).format(value);
  }
  if (type === "currency") return `INR ${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  if (type === "number") return Number(value).toLocaleString("en-IN");
  return String(value);
};

export const createPdfReport = (report: ReportExportDocument) =>
  new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 32,
      bufferPages: true,
    });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    const pageWidth = doc.page.width - 64;
    const weight = report.columns.reduce((sum, column) => sum + (column.width ?? 14), 0);
    const widths = report.columns.map((column) => pageWidth * ((column.width ?? 14) / weight));
    const drawHeader = () => {
      doc.font("Helvetica-Bold").fontSize(18).fillColor("#26304a").text(report.title);
      doc.moveDown(0.25).font("Helvetica").fontSize(9).fillColor("#526484");
      doc.text(`${report.salonName} | ${report.branchName}`);
      doc.text(`Generated: ${new Intl.DateTimeFormat("en-IN", {
        timeZone: report.timezone,
        dateStyle: "medium",
        timeStyle: "short",
      }).format(report.generatedAt)}`);
      doc.text(`Filters: ${Object.entries(report.filters).map(([key, value]) => `${key}: ${value}`).join(" | ") || "None"}`);
      doc.moveDown(0.6);
    };
    const drawTableHeader = () => {
      const y = doc.y;
      doc.rect(32, y, pageWidth, 22).fill("#6576ff");
      let x = 32;
      report.columns.forEach((column, index) => {
        doc.font("Helvetica-Bold").fontSize(8).fillColor("#ffffff")
          .text(column.label, x + 4, y + 6, { width: widths[index]! - 8, ellipsis: true });
        x += widths[index]!;
      });
      doc.y = y + 22;
    };
    const newPage = () => {
      doc.addPage();
      drawHeader();
      drawTableHeader();
    };

    drawHeader();
    drawTableHeader();
    const writeRow = (row: Record<string, ReportCellValue>, total = false) => {
      const values = report.columns.map((column) => display(row[column.key] ?? null, column.type, report.timezone));
      const height = Math.max(
        20,
        ...values.map((value, index) =>
          doc.heightOfString(value, { width: widths[index]! - 8, height: 42 })
        )
      );
      if (doc.y + height > doc.page.height - 45) newPage();
      const y = doc.y;
      doc.rect(32, y, pageWidth, height).fill(total ? "#e5e9ff" : report.rows.indexOf(row) % 2 ? "#f7f8fb" : "#ffffff");
      let x = 32;
      values.forEach((value, index) => {
        doc.font(total ? "Helvetica-Bold" : "Helvetica").fontSize(7.5).fillColor("#364a63")
          .text(value, x + 4, y + 5, { width: widths[index]! - 8, height: height - 8, ellipsis: true });
        x += widths[index]!;
      });
      doc.y = y + height;
    };
    report.rows.forEach((row) => writeRow(row));
    if (report.totals) writeRow(report.totals, true);

    const range = doc.bufferedPageRange();
    for (let index = range.start; index < range.start + range.count; index += 1) {
      doc.switchToPage(index);
      doc.font("Helvetica").fontSize(8).fillColor("#8094ae")
        .text(`Page ${index + 1} of ${range.count}`, 32, doc.page.height - 26, {
          width: pageWidth,
          align: "right",
        });
    }
    doc.end();
  });
