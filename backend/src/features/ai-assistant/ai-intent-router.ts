export type AiIntent = string | "BLOCKED" | null;

export function detectToolName(message: string): AiIntent {
  const text = message.toLowerCase();

  if (
    text.includes("sql") ||
    text.includes("drop table") ||
    text.includes("delete") ||
    text.includes("update salary") ||
    text.includes("change salary") ||
    text.includes("cancel all")
  ) {
    return "BLOCKED";
  }

  if (text.includes("appointment") && text.includes("today")) {
    return "getTodayAppointments";
  }

  if (text.includes("revenue") || text.includes("sales")) {
    return "getRevenueSummary";
  }

  if (text.includes("low stock") || text.includes("stock low")) {
    return "getLowStockProducts";
  }

  if (text.includes("outstanding") || text.includes("balance due")) {
    return "getOutstandingCustomers";
  }

  if (text.includes("package") && text.includes("expir")) {
    return "getPackageExpirySummary";
  }

  if (text.includes("membership") && text.includes("expir")) {
    return "getMembershipExpirySummary";
  }

  return null;
}
