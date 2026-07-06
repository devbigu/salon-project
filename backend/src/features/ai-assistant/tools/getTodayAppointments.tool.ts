import { prisma } from "../../../config/prisma.js";
import { parseSalonDateRange } from "../../../utils/timezone.js";
import type {
  AiTool,
  AiToolContext,
} from "../ai-tool.types.js";
import { aiExactBranchScope } from "../ai-permission.service.js";

const localDate = (date: Date, timezone: string) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
};

const todayRange = async (
  context: AiToolContext
): Promise<{ start: Date; end: Date }> => {
  const salon = context.salonId
    ? await prisma.salon.findUnique({
        where: { id: context.salonId },
        select: { timezone: true },
      })
    : null;
  const timezone = salon?.timezone ?? "Asia/Kolkata";
  const today = localDate(new Date(), timezone);
  const range = parseSalonDateRange(today, today, timezone);
  const { start, end } = range;
  if (!start || !end) {
    throw new Error("Unable to determine the salon day");
  }
  return { start, end };
};

export const getTodayAppointmentsTool: AiTool = {
  name: "getTodayAppointments",
  description: "Returns today's appointment summary.",
  allowedRoles: [
    "SUPER_ADMIN",
    "SALON_ADMIN",
    "BRANCH_MANAGER",
    "RECEPTIONIST",
  ],

  async run({ context }) {
    const { start, end } = await todayRange(context);
    const appointments = await prisma.appointment.findMany({
      where: {
        ...(context.salonId ? { salonId: context.salonId } : {}),
        ...aiExactBranchScope(context),
        startTime: { gte: start, lt: end },
      },
      select: { status: true },
    });

    const byStatus = appointments.reduce<Record<string, number>>(
      (counts, appointment) => {
        counts[appointment.status] = (counts[appointment.status] ?? 0) + 1;
        return counts;
      },
      {}
    );

    return {
      summary: `You have ${appointments.length} appointment${
        appointments.length === 1 ? "" : "s"
      } today.`,
      data: {
        total: appointments.length,
        byStatus,
      },
    };
  },
};
