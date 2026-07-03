import { type Request } from "express";
import { prisma } from "../../config/prisma.js";
import {
  Prisma,
  type AuditAction,
  type AuditModule,
  type Role,
} from "../../generated/prisma/client.js";
import { AuditLogModel } from "./audit-log.model.js";

type AuditClient = Prisma.TransactionClient;

type CreateAuditLogInput = {
  tx?: AuditClient;
  salonId?: string | null | undefined;
  branchId?: string | null | undefined;
  userId?: string | null | undefined;
  userName?: string | null | undefined;
  userRole?: Role | null | undefined;
  module: AuditModule;
  action: AuditAction;
  entityId?: string | null | undefined;
  entityCode?: string | null | undefined;
  entityName?: string | null | undefined;
  description: string;
  oldData?: unknown;
  newData?: unknown;
  ipAddress?: string | null | undefined;
  userAgent?: string | null | undefined;
};

const SENSITIVE_KEYS = new Set([
  "password", "passwordhash", "token", "accesstoken", "refreshtoken",
  "refreshtokenhash", "authorization", "cookie", "cardnumber", "cvv",
  "otp", "secret", "apikey", "jwt", "session",
]);

const isSensitiveKey = (key: string) =>
  SENSITIVE_KEYS.has(key.replace(/[^a-z0-9]/gi, "").toLowerCase());

const sanitizeValue = (
  value: unknown,
  seen = new WeakSet<object>()
): Prisma.InputJsonValue | null | undefined => {
  if (value === undefined || typeof value === "function" || typeof value === "symbol") {
    return undefined;
  }
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : String(value);
  }
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Prisma.Decimal.isDecimal(value)) return value.toString();
  if (Array.isArray(value)) {
    if (seen.has(value)) return "[Circular]";
    seen.add(value);
    const sanitized = value
      .map((item) => sanitizeValue(item, seen))
      .filter(
        (item): item is Prisma.InputJsonValue | null => item !== undefined
      );
    seen.delete(value);
    return sanitized;
  }
  if (typeof value === "object") {
    if (seen.has(value)) return "[Circular]";
    seen.add(value);
    const sanitized: Record<string, Prisma.InputJsonValue | null> = {};
    for (const [key, item] of Object.entries(value)) {
      if (isSensitiveKey(key)) {
        sanitized[key] = "[REDACTED]";
        continue;
      }
      const next = sanitizeValue(item, seen);
      if (next !== undefined) sanitized[key] = next;
    }
    seen.delete(value);
    return sanitized;
  }
  return String(value);
};

export const sanitizeAuditData = (value: unknown) => sanitizeValue(value);

export const requestAuditContext = (req: Request) => {
  const forwarded = req.headers["x-forwarded-for"];
  const ipAddress =
    typeof forwarded === "string"
      ? forwarded.split(",")[0]?.trim()
      : Array.isArray(forwarded)
        ? forwarded[0]
        : req.ip;
  const userAgent = req.get("user-agent");
  return {
    ...(ipAddress ? { ipAddress } : {}),
    ...(userAgent ? { userAgent } : {}),
  };
};

export const createAuditLog = async (input: CreateAuditLogInput) => {
  const client = input.tx ?? prisma;
  const actor =
    input.userId && (!input.userName || !input.userRole)
      ? await client.user.findUnique({
          where: { id: input.userId },
          select: { name: true, role: true, salonId: true, branchId: true },
        })
      : null;
  const oldData = sanitizeAuditData(input.oldData);
  const newData = sanitizeAuditData(input.newData);

  return AuditLogModel.create(
    {
      salonId: input.salonId ?? actor?.salonId ?? null,
      branchId: input.branchId ?? actor?.branchId ?? null,
      userId: input.userId ?? null,
      userName: input.userName ?? actor?.name ?? null,
      userRole: input.userRole ?? actor?.role ?? null,
      module: input.module,
      action: input.action,
      entityId: input.entityId ?? null,
      entityCode: input.entityCode ?? null,
      entityName: input.entityName ?? null,
      description: input.description,
      ...(oldData !== undefined
        ? { oldData: oldData === null ? Prisma.JsonNull : oldData }
        : {}),
      ...(newData !== undefined
        ? { newData: newData === null ? Prisma.JsonNull : newData }
        : {}),
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    },
    input.tx
  );
};

export const createBestEffortAuditLog = async (input: CreateAuditLogInput) => {
  try {
    return await createAuditLog(input);
  } catch {
    console.error("Audit log write failed");
    return null;
  }
};
