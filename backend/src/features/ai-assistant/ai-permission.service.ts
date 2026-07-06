import type { AiRole, AiTool, AiToolContext } from "./ai-tool.types.js";

const BRANCH_SCOPED_ROLES: readonly AiRole[] = [
  "BRANCH_MANAGER",
  "RECEPTIONIST",
  "STAFF",
];

export function canUseAiTool(role: AiRole, tool: AiTool): boolean {
  return tool.allowedRoles.includes(role);
}

export function hasValidAiDataScope(context: AiToolContext): boolean {
  if (context.role !== "SUPER_ADMIN" && !context.salonId) return false;
  if (BRANCH_SCOPED_ROLES.includes(context.role) && !context.branchId) {
    return false;
  }
  return true;
}

export function aiExactBranchScope(context: AiToolContext) {
  return BRANCH_SCOPED_ROLES.includes(context.role) && context.branchId
    ? { branchId: context.branchId }
    : {};
}

export function aiSharedBranchScope(context: AiToolContext) {
  return BRANCH_SCOPED_ROLES.includes(context.role) && context.branchId
    ? { OR: [{ branchId: context.branchId }, { branchId: null }] }
    : {};
}
