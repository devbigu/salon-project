import PDFDocument from "pdfkit";
import type { Response } from "express";
import type { AwaitedSalarySlip } from "./salarySlip.types.js";

const amount = (value: unknown) => `INR ${Number(value ?? 0).toFixed(2)}`;
const monthName = (month: number, year: number) =>
  new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month - 1, 1))
  );

export const streamSalarySlipPdf = (slip: AwaitedSalarySlip, res: Response) => {
  const code = slip.staff.staffCode || slip.staffId;
  const filename = `salary-slip-${code}-${slip.month}-${slip.year}.pdf`.replace(/[^a-zA-Z0-9_.-]/g, "-");
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const doc = new PDFDocument({ size: "A4", margin: 45 });
  doc.pipe(res);
  doc.fontSize(20).text(slip.salon.name, { align: "center" });
  const address = [slip.salon.addressLine1, slip.salon.addressLine2, slip.salon.city, slip.salon.state, slip.salon.postalCode]
    .filter(Boolean)
    .join(", ");
  doc.fontSize(9).text(address, { align: "center" });
  doc.text([slip.salon.phone, slip.salon.email].filter(Boolean).join(" | "), { align: "center" });
  doc.moveDown().fontSize(16).text(`Salary Slip - ${monthName(slip.month, slip.year)}`, { align: "center" });
  doc.moveDown().fontSize(10);
  doc.text(`Staff: ${slip.staff.name} (${slip.staff.staffCode || slip.staffId})`);
  doc.text(`Role: ${slip.staff.jobRole}`);
  doc.text(`Branch: ${slip.branch?.name || "All branches"}`);
  doc.text(`Status: ${slip.status}`);
  doc.text(`Generated: ${slip.generatedAt.toLocaleDateString("en-IN")}`);
  doc.text(`Paid: ${slip.paidAt ? slip.paidAt.toLocaleDateString("en-IN") : "Not paid"}`);

  const section = (title: string, rows: Array<[string, string | number]>) => {
    doc.moveDown().fontSize(12).text(title, { underline: true });
    doc.fontSize(10);
    for (const [label, value] of rows) {
      doc.text(`${label}: ${value}`);
    }
  };
  section("Attendance", [
    ["Working days", slip.workingDays], ["Present days", slip.presentDays], ["Half days", slip.halfDays],
    ["Paid leave days", slip.paidLeaveDays], ["Unpaid leave days", slip.unpaidLeaveDays],
    ["Absent days", slip.absentDays], ["Late days", slip.lateDays], ["Total late minutes", slip.totalLateMinutes],
  ]);
  section("Salary and deductions", [
    ["Base salary", amount(slip.baseSalary)], ["Per-day salary", amount(slip.perDaySalary)],
    ["Unpaid leave deduction", amount(slip.unpaidLeaveDeduction)], ["Late penalty", amount(slip.latePenalty)],
    ["Manual deduction", amount(slip.manualDeduction)], ["Bonus", amount(slip.bonusAmount)],
  ]);
  section("Service commission", [
    ["Revenue", amount(slip.serviceRevenue)], ["Threshold", amount(slip.serviceMinimumWorkThreshold)],
    ["Percentage", `${slip.serviceCommissionPercentage}%`], ["Commission", amount(slip.serviceCommissionAmount)],
  ]);
  section("Retail commission", [
    ["Revenue", amount(slip.retailSalesRevenue)], ["Threshold", amount(slip.retailMinimumSalesThreshold)],
    ["Percentage", `${slip.retailCommissionPercentage}%`], ["Commission", amount(slip.retailCommissionAmount)],
  ]);
  doc.moveDown().fontSize(13).text(`Gross salary: ${amount(slip.grossSalary)}`);
  doc.fontSize(15).text(`Net salary: ${amount(slip.netSalary)}`, { underline: true });
  if (slip.note) doc.moveDown().fontSize(10).text(`Note: ${slip.note}`);
  doc.moveDown(3).fontSize(10).text("Authorized signature: ______________________________", { align: "right" });
  doc.end();
};
