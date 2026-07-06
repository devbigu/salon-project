import { randomUUID } from "node:crypto";
import { prisma } from "../../config/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";
import {
  getSalonLocalParts,
  parseSalonDateRange,
} from "../../utils/timezone.js";
import { buildBusinessCode } from "../../utils/business-id.js";
import { createAuditLog } from "../audit-logs/audit-log.service.js";
import {
  calculateAvailableSlots,
  checkStaffAvailabilityForSlot,
} from "../staff-availability/staffAvailability.service.js";

type DbClient = typeof prisma | Prisma.TransactionClient;

export class PublicBookingError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "PublicBookingError";
  }
}

export type PublicAppointmentInput = {
  branchId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serviceIds: string[];
  staffId?: string;
  startTime: Date;
  note?: string;
};

type AuditContext = {
  ipAddress?: string;
  userAgent?: string;
};

const durationMinutes = (service: {
  durationValue: number | null;
  durationUnit: "MINUTES" | "HOURS";
}) =>
  (service.durationValue ?? 0) * (service.durationUnit === "HOURS" ? 60 : 1);

export const normalizePhone = (phone: string) => {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  return `${trimmed.startsWith("+") ? "+" : ""}${digits}`;
};

const settingInclude = {
  salon: {
    select: {
      id: true,
      name: true,
      timezone: true,
      status: true,
    },
  },
  branch: {
    select: {
      id: true,
      name: true,
      status: true,
      salonId: true,
    },
  },
} as const;

export const getEnabledSetting = async (slug: string, client: DbClient = prisma) => {
  const setting = await client.publicBookingSetting.findUnique({
    where: { slug },
    include: settingInclude,
  });

  if (
    !setting ||
    !setting.isEnabled ||
    !setting.salon.status ||
    (setting.branch && !setting.branch.status)
  ) {
    throw new PublicBookingError(404, "Online booking is unavailable");
  }

  return setting;
};

const resolveActiveBranch = async (
  setting: Awaited<ReturnType<typeof getEnabledSetting>>,
  branchId: string,
  client: DbClient = prisma
) => {
  if (setting.branchId && setting.branchId !== branchId) {
    throw new PublicBookingError(404, "Branch is unavailable");
  }

  const branch = await client.branch.findFirst({
    where: {
      id: branchId,
      salonId: setting.salonId,
      status: true,
    },
    select: { id: true, name: true },
  });
  if (!branch) throw new PublicBookingError(404, "Branch is unavailable");
  return branch;
};

const serviceWhere = (salonId: string, branchId: string, ids?: string[]) => ({
  salonId,
  status: true,
  ...(ids ? { id: { in: ids } } : {}),
  OR: [{ branchId: null }, { branchId }],
});

const staffWhere = (salonId: string, branchId: string, staffId?: string) => ({
  salonId,
  status: true,
  ...(staffId ? { id: staffId } : {}),
  OR: [{ branchId: null }, { branchId }],
});

export const listPublicBranches = async (slug: string) => {
  const setting = await getEnabledSetting(slug);
  return prisma.branch.findMany({
    where: {
      salonId: setting.salonId,
      status: true,
      ...(setting.branchId ? { id: setting.branchId } : {}),
    },
    select: { id: true, name: true, addressLine1: true, city: true, phone: true },
    orderBy: { name: "asc" },
  });
};

export const listPublicServicesAndStaff = async (
  slug: string,
  branchId: string
) => {
  const setting = await getEnabledSetting(slug);
  await resolveActiveBranch(setting, branchId);

  const [services, staff] = await Promise.all([
    prisma.service.findMany({
      where: serviceWhere(setting.salonId, branchId),
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        durationValue: true,
        durationUnit: true,
        mainService: { select: { id: true, name: true } },
      },
      orderBy: [{ mainService: { name: "asc" } }, { name: "asc" }],
    }),
    setting.allowStaffSelection
      ? prisma.staff.findMany({
          where: staffWhere(setting.salonId, branchId),
          select: { id: true, name: true, jobRole: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  return { services, staff };
};

type Slot = {
  startTime: string;
  endTime: string;
  staffId: string;
  staffName: string;
};

const loadBookingResources = async (
  setting: Awaited<ReturnType<typeof getEnabledSetting>>,
  branchId: string,
  serviceIds: string[],
  staffId: string | undefined,
  client: DbClient
) => {
  await resolveActiveBranch(setting, branchId, client);
  const uniqueServiceIds = [...new Set(serviceIds)];
  if (uniqueServiceIds.length !== serviceIds.length) {
    throw new PublicBookingError(400, "Duplicate service IDs are not allowed");
  }

  const services = await client.service.findMany({
    where: serviceWhere(setting.salonId, branchId, uniqueServiceIds),
    select: {
      id: true,
      name: true,
      price: true,
      durationValue: true,
      durationUnit: true,
    },
  });
  const staff = await client.staff.findMany({
    where: staffWhere(setting.salonId, branchId, staffId),
    select: {
      id: true,
      name: true,
      jobRole: true,
      workingFrom: true,
      workingTo: true,
      weekOff: true,
    },
    orderBy: { name: "asc" },
  });

  if (services.length !== uniqueServiceIds.length) {
    throw new PublicBookingError(400, "One or more services are unavailable");
  }
  if (staffId && staff.length !== 1) {
    throw new PublicBookingError(400, "Selected staff member is unavailable");
  }
  if (staff.length === 0) {
    throw new PublicBookingError(409, "No staff are available");
  }

  const totalDurationMinutes = services.reduce(
    (total, service) => total + durationMinutes(service),
    0
  );
  if (totalDurationMinutes <= 0) {
    throw new PublicBookingError(400, "Selected services have no bookable duration");
  }

  return { services, staff, totalDurationMinutes };
};

const assertBookingWindow = (
  setting: Awaited<ReturnType<typeof getEnabledSetting>>,
  startTime: Date,
  now: Date
) => {
  const earliest = new Date(now.getTime() + setting.minNoticeMinutes * 60_000);
  const latest = new Date(now.getTime() + setting.bookingWindowDays * 86_400_000);
  if (startTime < earliest) {
    throw new PublicBookingError(
      400,
      `Bookings require at least ${setting.minNoticeMinutes} minutes notice`
    );
  }
  if (startTime > latest) {
    throw new PublicBookingError(
      400,
      `Bookings can only be made ${setting.bookingWindowDays} days ahead`
    );
  }
};

export const findAvailableSlots = async (input: {
  slug: string;
  branchId: string;
  serviceIds: string[];
  staffId?: string;
  date: string;
  now?: Date;
}) => {
  const setting = await getEnabledSetting(input.slug);
  const staffId =
    setting.allowStaffSelection && input.staffId ? input.staffId : undefined;
  const resources = await loadBookingResources(
    setting,
    input.branchId,
    input.serviceIds,
    staffId,
    prisma
  );
  const range = parseSalonDateRange(
    input.date,
    input.date,
    setting.salon.timezone
  );
  if (!range.start || !range.end) {
    throw new PublicBookingError(400, "Invalid date");
  }

  const now = input.now ?? new Date();
  const latestAllowed = new Date(
    now.getTime() + setting.bookingWindowDays * 86_400_000
  );
  if (range.end <= now || range.start > latestAllowed) {
    return {
      date: input.date,
      totalDurationMinutes: resources.totalDurationMinutes,
      timezone: setting.salon.timezone,
      slots: [] as Slot[],
    };
  }

  const slots: Slot[] = await calculateAvailableSlots({
    salonId: setting.salonId,
    branchId: input.branchId,
    staff: resources.staff,
    date: input.date,
    timezone: setting.salon.timezone,
    totalDurationMinutes: resources.totalDurationMinutes,
    slotIntervalMinutes: setting.slotIntervalMinutes,
    notBefore: new Date(
      now.getTime() + setting.minNoticeMinutes * 60_000
    ),
    notAfter: latestAllowed,
  });
  return {
    date: input.date,
    totalDurationMinutes: resources.totalDurationMinutes,
    timezone: setting.salon.timezone,
    slots,
  };
};

const findCustomerByPhone = async (
  tx: Prisma.TransactionClient,
  salonId: string,
  normalizedPhone: string
) => {
  const digits = normalizedPhone.replace(/\D/g, "");
  const rows = await tx.$queryRaw<{ id: string }[]>`
    SELECT "id"
    FROM "Customer"
    WHERE "salonId" = ${salonId}
      AND regexp_replace(COALESCE("phone", ''), '[^0-9]', '', 'g') = ${digits}
    LIMIT 1
  `;
  return rows[0]
    ? tx.customer.findUnique({ where: { id: rows[0].id } })
    : null;
};

const lock = async (tx: Prisma.TransactionClient, key: string) => {
  await tx.$queryRaw`
    SELECT pg_advisory_xact_lock(hashtext(${key})) IS NULL AS "locked"
  `;
};

const sameServiceIds = (
  existing: { services: { serviceId: string }[] },
  serviceIds: string[]
) => {
  const left = existing.services.map((service) => service.serviceId).sort();
  const right = [...serviceIds].sort();
  return left.length === right.length && left.every((id, index) => id === right[index]);
};

export const createPublicAppointment = async (
  slug: string,
  input: PublicAppointmentInput,
  auditContext: AuditContext
) => {
  const normalizedPhone = normalizePhone(input.customerPhone);

  return prisma.$transaction(
    async (tx) => {
      const setting = await getEnabledSetting(slug, tx);
      if (setting.requireCustomerOtp) {
        throw new PublicBookingError(
          503,
          "Customer OTP verification is not configured"
        );
      }
      assertBookingWindow(setting, input.startTime, new Date());
      await lock(
        tx,
        `public-customer:${setting.salonId}:${normalizedPhone}:${input.startTime.toISOString()}`
      );

      const selectedStaffId =
        setting.allowStaffSelection && input.staffId ? input.staffId : undefined;
      const resources = await loadBookingResources(
        setting,
        input.branchId,
        input.serviceIds,
        selectedStaffId,
        tx
      );

      let customer = await findCustomerByPhone(
        tx,
        setting.salonId,
        normalizedPhone
      );
      if (!customer) {
        customer = await tx.customer.create({
          data: {
            customerCode: `CUS-${Date.now()}-${randomUUID().slice(0, 8)}`,
            name: input.customerName,
            phone: normalizedPhone,
            ...(input.customerEmail ? { email: input.customerEmail } : {}),
            salonId: setting.salonId,
            branchId: input.branchId,
          },
        });
      }

      const duplicate = await tx.appointment.findFirst({
        where: {
          salonId: setting.salonId,
          branchId: input.branchId,
          customerId: customer.id,
          startTime: input.startTime,
          status: { notIn: ["CANCELLED", "NO_SHOW"] },
        },
        include: { services: { select: { serviceId: true } } },
      });
      if (duplicate && sameServiceIds(duplicate, input.serviceIds)) {
        return { appointment: duplicate, duplicate: true };
      }

      const endTime = new Date(
        input.startTime.getTime() + resources.totalDurationMinutes * 60_000
      );
      const local = getSalonLocalParts(input.startTime, setting.salon.timezone);
      const localDate = `${local.year}-${String(local.month).padStart(2, "0")}-${String(
        local.day
      ).padStart(2, "0")}`;
      let chosen:
        | (typeof resources.staff)[number]
        | undefined;
      for (const member of resources.staff) {
        await lock(tx, `public-staff-day:${member.id}:${localDate}`);
        await tx.$queryRaw`SELECT "id" FROM "Staff" WHERE "id" = ${member.id} FOR UPDATE`;
        const availability = await checkStaffAvailabilityForSlot({
          client: tx,
          staffId: member.id,
          startTime: input.startTime,
          endTime,
          salonId: setting.salonId,
          branchId: input.branchId,
        });
        if (availability.available) {
          chosen = member;
          break;
        }
      }
      if (!chosen) {
        throw new PublicBookingError(409, "The selected slot is no longer available");
      }

      const approvalPrefix = setting.requireApproval
        ? "Public booking — approval required."
        : "Public online booking.";
      const bookingNote = input.note
        ? `${approvalPrefix}\nCustomer note: ${input.note}`
        : approvalPrefix;
      const estimatedAmount = resources.services.reduce(
        (total, service) => total + Number(service.price),
        0
      );
      const appointmentCode = buildBusinessCode({
        salonName: setting.salon.name,
        type: "APT",
        timezone: setting.salon.timezone,
      });
      const appointment = await tx.appointment.create({
        data: {
          appointmentCode,
          salonId: setting.salonId,
          branchId: input.branchId,
          customerId: customer.id,
          staffId: chosen.id,
          startTime: input.startTime,
          endTime,
          totalDurationMinutes: resources.totalDurationMinutes,
          estimatedAmount,
          status: "SCHEDULED",
          source: "PUBLIC",
          bookingNote,
          services: {
            create: resources.services.map((service) => ({
              serviceId: service.id,
              serviceName: service.name,
              price: service.price,
              durationValue: service.durationValue,
              durationUnit: service.durationUnit,
            })),
          },
        },
        include: {
          customer: { select: { id: true, name: true } },
          staff: { select: { id: true, name: true } },
          services: {
            select: { serviceId: true, serviceName: true, price: true },
          },
        },
      });

      await createAuditLog({
        tx,
        salonId: setting.salonId,
        branchId: input.branchId,
        module: "APPOINTMENT",
        action: "CREATE",
        entityId: appointment.id,
        entityCode: appointment.appointmentCode,
        entityName: customer.name,
        description: `Public appointment ${appointment.appointmentCode} created`,
        newData: {
          source: "PUBLIC_BOOKING",
          status: appointment.status,
          startTime: appointment.startTime,
          staffId: appointment.staffId,
          customerId: appointment.customerId,
          serviceIds: input.serviceIds,
          approvalRequired: setting.requireApproval,
        },
        ...auditContext,
      });

      return { appointment, duplicate: false };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
};
