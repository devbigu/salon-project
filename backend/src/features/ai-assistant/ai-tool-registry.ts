import type { AiTool } from "./ai-tool.types.js";
import { getTodayAppointmentsTool } from "./tools/getTodayAppointments.tool.js";
import { getRevenueSummaryTool } from "./tools/getRevenueSummary.tool.js";
import { getLowStockProductsTool } from "./tools/getLowStockProducts.tool.js";
import { getOutstandingCustomersTool } from "./tools/getOutstandingCustomers.tool.js";
import { getPackageExpirySummaryTool } from "./tools/getPackageExpirySummary.tool.js";
import { getMembershipExpirySummaryTool } from "./tools/getMembershipExpirySummary.tool.js";

const tools: AiTool[] = [
  getTodayAppointmentsTool,
  getRevenueSummaryTool,
  getLowStockProductsTool,
  getOutstandingCustomersTool,
  getPackageExpirySummaryTool,
  getMembershipExpirySummaryTool,
];

export function getAiTools(): readonly AiTool[] {
  return tools;
}

export function getAiToolByName(name: string): AiTool | undefined {
  return tools.find((tool) => tool.name === name);
}
