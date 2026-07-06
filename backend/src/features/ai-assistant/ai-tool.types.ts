export type AiRole =
  | "SUPER_ADMIN"
  | "SALON_ADMIN"
  | "BRANCH_MANAGER"
  | "RECEPTIONIST"
  | "STAFF";

export type AiToolContext = {
  userId: string;
  role: AiRole;
  salonId?: string;
  branchId?: string;
};

export type AiToolResult = {
  summary: string;
  data?: unknown;
};

export type AiToolRunParams = {
  message: string;
  context: AiToolContext;
};

export interface AiTool {
  name: string;
  description: string;
  allowedRoles: AiRole[];
  run(params: AiToolRunParams): Promise<AiToolResult>;
}

export const AI_ROLES: readonly AiRole[] = [
  "SUPER_ADMIN",
  "SALON_ADMIN",
  "BRANCH_MANAGER",
  "RECEPTIONIST",
  "STAFF",
];

export function isAiRole(value: string): value is AiRole {
  return AI_ROLES.some((role) => role === value);
}
