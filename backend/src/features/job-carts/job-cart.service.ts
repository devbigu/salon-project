import { randomUUID } from "node:crypto";
import { prisma } from "../../config/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";
import {
  buildBusinessCode,
  businessCodeDayRange,
} from "../../utils/business-id.js";
import { AppointmentModel } from "../appointments/appointment.model.js";
import { createAuditLog } from "../audit-logs/audit-log.service.js";
import { issueInvoice } from "../coupons/coupon.service.js";
import { InvoiceModel } from "../Invoices/invoice.model.js";
import { normalizePhone } from "../public-booking/public-booking.service.js";

type TransactionClient = Prisma.TransactionClient;

export type JobCartActor = {
  userId: string;
  role: string;
  salonId?: string;
  branchId?: string;
};

type AuditContext = {
  ipAddress?: string;
  userAgent?: string;
};

export class JobCartError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "JobCartError";
  }
}

const branchScopedRoles = new Set(["BRANCH_MANAGER", "RECEPTIONIST"]);
const activeAppointmentStatuses = [
  "SCHEDULED",
  "CONFIRMED",
  "CHECKED_IN",
] as const;

const jobCartInclude = {
  salon: { select: { id: true, name: true, timezone: true } },
  branch: { select: { id: true, name: true } },
  customer: {
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      customerCode: true,
      walletBalance: true,
      outstandingAmount: true,
      loyaltyPoints: true,
      membership: {
        select: {
          id: true,
          name: true,
          discountPercentage: true,
          status: true,
        },
      },
    },
  },
  staff: { select: { id: true, name: true, jobRole: true } },
  createdBy: { select: { id: true, name: true, email: true, role: true } },
  services: {
    include: {
      service: {
        select: {
          id: true,
          name: true,
          status: true,
          durationValue: true,
          durationUnit: true,
        },
      },
    },
    orderBy: { createdAt: "asc" as const },
  },
  invoice: {
    include: {
      items: { orderBy: { createdAt: "asc" as const } },
      payments: { orderBy: { paidAt: "asc" as const } },
      coupon: true,
    },
  },
} as const;

type JobCartRecord = Prisma.AppointmentGetPayload<{
  include: typeof jobCartInclude;
}>;

const mappedStatus = (cart: JobCartRecord) => {
  if (
    cart.status === "CANCELLED" ||
    cart.invoice?.status === "CANCELLED"
  ) {
    return "CANCELLED" as const;
  }
  if (
    cart.status === "COMPLETED" &&
    cart.invoice &&
    ["ISSUED"].includes(cart.invoice.status)
  ) {
    return "COMPLETED" as const;
  }
  return "ACTIVE" as const;
};

const present = (cart: JobCartRecord) => ({
  id: cart.id,
  appointmentId: cart.id,
  jobCartId: cart.appointmentCode,
  appointmentCode: cart.appointmentCode,
  salonId: cart.salonId,
  branchId: cart.branchId,
  customerId: cart.customerId,
  staffId: cart.staffId,
  startTime: cart.startTime,
  endTime: cart.endTime,
  totalDurationMinutes: cart.totalDurationMinutes,
  estimatedAmount: cart.estimatedAmount,
  status: mappedStatus(cart),
  appointmentStatus: cart.status,
  source: cart.source,
  bookingNote: cart.bookingNote,
  internalNote: cart.internalNote,
  createdAt: cart.createdAt,
  updatedAt: cart.updatedAt,
  salon: cart.salon,
  branch: cart.branch,
  customer: cart.customer,
  staff: cart.staff,
  createdBy: cart.createdBy,
  editedBy: null,
  items: cart.services,
  invoice: cart.invoice,
});

const accessWhere = (actor: JobCartActor): Prisma.AppointmentWhereInput => {
  if (actor.role === "SUPER_ADMIN") return {};
  if (!actor.salonId) return { id: "__unauthorized__" };
  return {
    salonId: actor.salonId,
    ...(branchScopedRoles.has(actor.role)
      ? { branchId: actor.branchId ?? "__unauthorized__" }
      : {}),
  };
};

const requireCreateScope = (
  actor: JobCartActor,
  requestedSalonId: string | undefined,
  requestedBranchId: string
) => {
  const salonId =
    actor.role === "SUPER_ADMIN" ? requestedSalonId : actor.salonId;
  if (!salonId) {
    throw new JobCartError(400, "Salon is required");
  }
  const branchId = branchScopedRoles.has(actor.role)
    ? actor.branchId
    : requestedBranchId;
  if (!branchId) {
    throw new JobCartError(400, "Branch is required");
  }
  if (
    branchScopedRoles.has(actor.role) &&
    requestedBranchId !== actor.branchId
  ) {
    throw new JobCartError(404, "Branch not found");
  }
  return { salonId, branchId };
};

const durationMinutes = (service: {
  durationValue: number | null;
  durationUnit: "MINUTES" | "HOURS";
}) =>
  (service.durationValue ?? 0) *
  (service.durationUnit === "HOURS" ? 60 : 1);

const findCustomerByPhone = async (
  tx: TransactionClient,
  salonId: string,
  normalizedPhone: string
) => {
  const digits = normalizedPhone.replace(/\D/g, "");
  const matches = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT "id"
    FROM "Customer"
    WHERE "salonId" = ${salonId}
      AND regexp_replace(COALESCE("phone", ''), '[^0-9]', '', 'g') = ${digits}
    LIMIT 1
  `;
  return matches[0]
    ? tx.customer.findUnique({ where: { id: matches[0].id } })
    : null;
};

const resolveCustomer = async (
  tx: TransactionClient,
  input: {
    salonId: string;
    branchId: string;
    customerName: string;
    phone: string;
  }
) => {
  const phone = normalizePhone(input.phone);
  let customer = await findCustomerByPhone(tx, input.salonId, phone);
  if (customer) {
    if (customer.name !== input.customerName || customer.phone !== phone) {
      customer = await tx.customer.update({
        where: { id: customer.id },
        data: { name: input.customerName, phone },
      });
    }
    return customer;
  }
  return tx.customer.create({
    data: {
      customerCode: `CUS-${Date.now()}-${randomUUID().slice(0, 8)}`,
      name: input.customerName,
      phone,
      salonId: input.salonId,
      branchId: input.branchId,
    },
  });
};

const validateBranch = async (
  tx: TransactionClient,
  salonId: string,
  branchId: string
) => {
  const branch = await tx.branch.findFirst({
    where: { id: branchId, salonId, status: true },
  });
  if (!branch) throw new JobCartError(400, "Invalid branch");
  return branch;
};

const validateStaff = async (
  tx: TransactionClient,
  salonId: string,
  branchId: string,
  staffId: string | null | undefined
) => {
  if (!staffId) return null;
  const staff = await tx.staff.findFirst({
    where: {
      id: staffId,
      salonId,
      status: true,
      OR: [{ branchId: null }, { branchId }],
    },
  });
  if (!staff) throw new JobCartError(400, "Invalid or unavailable staff");
  return staff;
};

const validateServices = async (
  tx: TransactionClient,
  salonId: string,
  branchId: string,
  serviceIds: string[]
) => {
  const uniqueIds = [...new Set(serviceIds)];
  if (uniqueIds.length !== serviceIds.length) {
    throw new JobCartError(400, "Duplicate services are not allowed");
  }
  if (!uniqueIds.length) return [];
  const services = await tx.service.findMany({
    where: {
      id: { in: uniqueIds },
      salonId,
      status: true,
      OR: [{ branchId: null }, { branchId }],
    },
  });
  if (services.length !== uniqueIds.length) {
    throw new JobCartError(400, "One or more services are unavailable");
  }
  const byId = new Map(services.map((service) => [service.id, service]));
  return uniqueIds.map((id) => byId.get(id)!);
};

const assertNoConflict = async (
  tx: TransactionClient,
  input: {
    staffId?: string | null;
    startTime: Date;
    endTime: Date;
    excludeAppointmentId?: string;
  }
) => {
  if (!input.staffId) return;
  const conflict = await tx.appointment.findFirst({
    where: {
      staffId: input.staffId,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      startTime: { lt: input.endTime },
      endTime: { gt: input.startTime },
      ...(input.excludeAppointmentId
        ? { id: { not: input.excludeAppointmentId } }
        : {}),
    },
    select: { id: true },
  });
  if (conflict) {
    throw new JobCartError(409, "Staff already has an overlapping appointment");
  }
};

const loadCart = async (
  client: typeof prisma | TransactionClient,
  id: string,
  actor: JobCartActor
) =>
  client.appointment.findFirst({
    where: {
      id,
      walkInJobCart: true,
      source: "WALK_IN",
      ...accessWhere(actor),
    },
    include: jobCartInclude,
  });

const requireCart = async (
  client: typeof prisma | TransactionClient,
  id: string,
  actor: JobCartActor
) => {
  const cart = await loadCart(client, id, actor);
  if (!cart) throw new JobCartError(404, "Job cart not found");
  return cart;
};

const requireMutable = (cart: JobCartRecord) => {
  if (mappedStatus(cart) !== "ACTIVE" || cart.invoice?.status !== "DRAFT") {
    throw new JobCartError(
      409,
      "Completed or cancelled job carts cannot be edited"
    );
  }
  if (
    !cart.invoice ||
    cart.invoice.paymentStatus !== "UNPAID" ||
    cart.invoice.paidAmount.gt(0)
  ) {
    throw new JobCartError(409, "Paid job carts cannot be edited");
  }
};

const recalculateCart = async (
  tx: TransactionClient,
  appointmentId: string
) => {
  const cart = await tx.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      services: { orderBy: { createdAt: "asc" } },
      customer: {
        include: {
          membership: true,
        },
      },
      invoice: {
        include: { items: true, payments: true },
      },
    },
  });
  if (!cart?.invoice) throw new JobCartError(409, "Draft invoice is missing");
  if (
    cart.invoice.status !== "DRAFT" ||
    cart.invoice.paymentStatus !== "UNPAID" ||
    cart.invoice.paidAmount.gt(0)
  ) {
    throw new JobCartError(409, "Job cart invoice can no longer be changed");
  }
  if (cart.invoice.couponId) {
    throw new JobCartError(409, "Remove the coupon before changing job items");
  }
  const loyaltyAdjustment = await tx.customerTransaction.findFirst({
    where: {
      invoiceId: cart.invoice.id,
      type: "ADJUSTMENT",
    },
    select: { id: true },
  });
  if (loyaltyAdjustment) {
    throw new JobCartError(
      409,
      "Job items cannot change after loyalty redemption"
    );
  }

  const subtotal = cart.services.reduce(
    (sum, item) => sum.add(item.price),
    new Prisma.Decimal(0)
  );
  const membershipPercentage =
    cart.customer.membership?.status === true
      ? cart.customer.membership.discountPercentage
      : new Prisma.Decimal(0);
  const membershipDiscount = Prisma.Decimal.min(
    subtotal.mul(membershipPercentage).div(100).toDecimalPlaces(2),
    subtotal
  );
  const total = subtotal.minus(membershipDiscount).toDecimalPlaces(2);
  const totalDurationMinutes = cart.services.reduce(
    (sum, item) =>
      sum +
      durationMinutes({
        durationValue: item.durationValue,
        durationUnit: item.durationUnit ?? "MINUTES",
      }),
    0
  );
  const endTime = new Date(
    cart.startTime.getTime() +
      Math.max(totalDurationMinutes, 30) * 60_000
  );
  await assertNoConflict(tx, {
    staffId: cart.staffId,
    startTime: cart.startTime,
    endTime,
    excludeAppointmentId: cart.id,
  });

  await tx.invoiceItem.deleteMany({ where: { invoiceId: cart.invoice.id } });
  await tx.invoice.update({
    where: { id: cart.invoice.id },
    data: {
      subtotalAmount: subtotal,
      discountAmount: membershipDiscount,
      couponDiscountAmount: 0,
      processingFeeAmount: 0,
      taxAmount: 0,
      totalAmount: total,
      balanceAmount: total,
      items: {
        create: cart.services.map((item) => ({
          serviceId: item.serviceId,
          itemCode: item.serviceId.slice(0, 8),
          description: item.serviceName,
          serviceName: item.serviceName,
          quantity: 1,
          unitPrice: item.price,
          discountAmount: 0,
          taxPercent: 0,
          taxAmount: 0,
          lineTotal: item.price,
        })),
      },
    },
  });
  await tx.appointment.update({
    where: { id: cart.id },
    data: {
      totalDurationMinutes,
      estimatedAmount: subtotal,
      endTime,
    },
  });
};

export const listJobCarts = async (
  actor: JobCartActor,
  filters: {
    page: number;
    limit: number;
    salonId?: string;
    branchId?: string;
    customerId?: string;
    search?: string;
    customerName?: string;
    phone?: string;
    status?: "ACTIVE" | "COMPLETED" | "CANCELLED";
    startDate?: Date;
    endDate?: Date;
    createdById?: string;
  }
) => {
  const scope = accessWhere(actor);
  const branchId = branchScopedRoles.has(actor.role)
    ? actor.branchId
    : filters.branchId;
  const statusWhere: Prisma.AppointmentWhereInput =
    filters.status === "ACTIVE"
      ? {
          status: { in: [...activeAppointmentStatuses] },
          invoice: { is: { status: "DRAFT" } },
        }
      : filters.status === "COMPLETED"
        ? {
            status: "COMPLETED",
            invoice: { is: { status: "ISSUED" } },
          }
        : filters.status === "CANCELLED"
          ? {
              OR: [
                { status: "CANCELLED" },
                { invoice: { is: { status: "CANCELLED" } } },
              ],
            }
          : {};
  const search = filters.search?.trim();
  const where: Prisma.AppointmentWhereInput = {
    walkInJobCart: true,
    source: "WALK_IN",
    ...scope,
    ...(actor.role === "SUPER_ADMIN" && filters.salonId
      ? { salonId: filters.salonId }
      : {}),
    ...(branchId ? { branchId } : {}),
    ...(filters.customerId ? { customerId: filters.customerId } : {}),
    ...(filters.createdById ? { createdById: filters.createdById } : {}),
    ...(filters.startDate || filters.endDate
      ? {
          startTime: {
            ...(filters.startDate ? { gte: filters.startDate } : {}),
            ...(filters.endDate ? { lte: filters.endDate } : {}),
          },
        }
      : {}),
    ...((filters.customerName || filters.phone || search)
      ? {
          AND: [
            ...(filters.customerName
              ? [
                  {
                    customer: {
                      name: {
                        contains: filters.customerName,
                        mode: "insensitive" as const,
                      },
                    },
                  },
                ]
              : []),
            ...(filters.phone
              ? [
                  {
                    customer: {
                      phone: {
                        contains: filters.phone,
                        mode: "insensitive" as const,
                      },
                    },
                  },
                ]
              : []),
            ...(search
              ? [
            {
              OR: [
                {
                  id: { contains: search, mode: "insensitive" as const },
                },
                {
                  appointmentCode: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  customer: {
                    name: {
                      contains: search,
                      mode: "insensitive" as const,
                    },
                  },
                },
                {
                  customer: {
                    phone: {
                      contains: search,
                      mode: "insensitive" as const,
                    },
                  },
                },
                {
                  services: {
                    some: {
                      serviceName: {
                        contains: search,
                        mode: "insensitive" as const,
                      },
                    },
                  },
                },
              ],
            },
                ]
              : []),
          ],
        }
      : {}),
    ...statusWhere,
  };
  const [total, rows] = await Promise.all([
    prisma.appointment.count({ where }),
    prisma.appointment.findMany({
      where,
      include: jobCartInclude,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
  ]);
  return {
    data: rows.map(present),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.max(Math.ceil(total / filters.limit), 1),
    },
  };
};

export const getJobCart = async (actor: JobCartActor, id: string) =>
  present(await requireCart(prisma, id, actor));

export const getJobCartReferences = async (
  actor: JobCartActor,
  requestedSalonId?: string,
  requestedBranchId?: string
) => {
  const salonId =
    actor.role === "SUPER_ADMIN" ? requestedSalonId : actor.salonId;
  const salons =
    actor.role === "SUPER_ADMIN"
      ? await prisma.salon.findMany({
          where: { status: true },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : [];
  if (!salonId) {
    return { salons, branches: [], staff: [], services: [] };
  }
  const branchId = branchScopedRoles.has(actor.role)
    ? actor.branchId
    : requestedBranchId;
  const branchWhere: Prisma.BranchWhereInput = {
    salonId,
    status: true,
    ...(branchScopedRoles.has(actor.role)
      ? { id: actor.branchId ?? "__unauthorized__" }
      : {}),
  };
  const resourceBranchWhere = branchId
    ? { OR: [{ branchId: null }, { branchId }] }
    : {};
  const [branches, staff, services] = await Promise.all([
    prisma.branch.findMany({
      where: branchWhere,
      select: { id: true, name: true, salonId: true },
      orderBy: { name: "asc" },
    }),
    prisma.staff.findMany({
      where: { salonId, status: true, ...resourceBranchWhere },
      select: { id: true, name: true, jobRole: true, branchId: true },
      orderBy: { name: "asc" },
    }),
    prisma.service.findMany({
      where: { salonId, status: true, ...resourceBranchWhere },
      select: {
        id: true,
        name: true,
        price: true,
        durationValue: true,
        durationUnit: true,
        branchId: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);
  return { salons, branches, staff, services };
};

export const createJobCart = async (
  actor: JobCartActor,
  input: {
    salonId?: string;
    branchId: string;
    customerName: string;
    phone: string;
    startTime: Date;
    staffId?: string;
    serviceIds: string[];
    bookingNote?: string;
    internalNote?: string;
  },
  audit: AuditContext
) =>
  prisma.$transaction(async (tx) => {
    const { salonId, branchId } = requireCreateScope(
      actor,
      input.salonId,
      input.branchId
    );
    const [branch, salon] = await Promise.all([
      validateBranch(tx, salonId, branchId),
      tx.salon.findFirst({
        where: { id: salonId, status: true },
      }),
    ]);
    if (!salon) throw new JobCartError(400, "Invalid salon");
    await validateStaff(tx, salonId, branchId, input.staffId);
    const services = await validateServices(
      tx,
      salonId,
      branchId,
      input.serviceIds
    );
    const duration = services.reduce(
      (sum, service) => sum + durationMinutes(service),
      0
    );
    const endTime = new Date(
      input.startTime.getTime() + Math.max(duration, 30) * 60_000
    );
    await assertNoConflict(tx, {
      ...(input.staffId ? { staffId: input.staffId } : {}),
      startTime: input.startTime,
      endTime,
    });
    const customer = await resolveCustomer(tx, {
      salonId,
      branchId,
      customerName: input.customerName,
      phone: input.phone,
    });
    const codeDate = new Date();
    const invoiceDayRange = businessCodeDayRange(codeDate, salon.timezone);
    const invoiceSerial =
      (await tx.invoice.count({
        where: {
          salonId,
          invoiceDate: {
            gte: invoiceDayRange.start,
            lt: invoiceDayRange.end,
          },
        },
      })) + 1;
    const appointment = await AppointmentModel.create(
      {
        appointmentCode: buildBusinessCode({
          salonName: salon.name,
          type: "JC",
          date: codeDate,
          timezone: salon.timezone,
        }),
        salonId,
        branchId,
        customerId: customer.id,
        ...(input.staffId ? { staffId: input.staffId } : {}),
        createdById: actor.userId,
        startTime: input.startTime,
        endTime,
        totalDurationMinutes: duration,
        estimatedAmount: services.reduce(
          (sum, service) => sum + Number(service.price),
          0
        ),
        status: "SCHEDULED",
        source: "WALK_IN",
        walkInJobCart: true,
        ...(input.bookingNote ? { bookingNote: input.bookingNote } : {}),
        ...(input.internalNote ? { internalNote: input.internalNote } : {}),
        services: services.map((service) => ({
          serviceId: service.id,
          serviceName: service.name,
          price: Number(service.price),
          ...(service.durationValue !== null
            ? { durationValue: service.durationValue }
            : {}),
          durationUnit: service.durationUnit,
        })),
      },
      tx
    );
    const membership = await tx.membership.findFirst({
      where: {
        id: customer.membershipId ?? "__none__",
        salonId,
        status: true,
      },
    });
    const subtotal = services.reduce(
      (sum, service) => sum.add(service.price),
      new Prisma.Decimal(0)
    );
    const discount = membership
      ? Prisma.Decimal.min(
          subtotal
            .mul(membership.discountPercentage)
            .div(100)
            .toDecimalPlaces(2),
          subtotal
        )
      : new Prisma.Decimal(0);
    const total = subtotal.minus(discount).toDecimalPlaces(2);
    const invoice = await InvoiceModel.create(
      {
        invoiceCode: buildBusinessCode({
          salonName: salon.name,
          type: "INV",
          date: codeDate,
          timezone: salon.timezone,
          serial: invoiceSerial,
        }),
        salonId,
        branchId,
        customerId: customer.id,
        appointmentId: appointment.id,
        invoiceType: "BILL_OF_SUPPLY",
        salonName: salon.name,
        ...(salon.phone ? { salonPhone: salon.phone } : {}),
        ...(salon.email ? { salonEmail: salon.email } : {}),
        salonAddress: [
          salon.addressLine1,
          salon.addressLine2,
          salon.city,
          salon.state,
          salon.country,
          salon.postalCode,
          branch.name,
        ]
          .filter(Boolean)
          .join(", "),
        customerName: customer.name,
        ...(customer.phone ? { customerPhone: customer.phone } : {}),
        ...(customer.email ? { customerEmail: customer.email } : {}),
        ...(customer.gst ? { customerGst: customer.gst } : {}),
        subtotalAmount: Number(subtotal),
        discountAmount: Number(discount),
        processingFeeAmount: 0,
        taxAmount: 0,
        totalAmount: Number(total),
        paidAmount: 0,
        balanceAmount: Number(total),
        status: "DRAFT",
        paymentStatus: "UNPAID",
        billingNote: `Walk-in job cart ${appointment.appointmentCode}`,
        items: services.map((service) => ({
          serviceId: service.id,
          itemCode: service.id.slice(0, 8),
          description: service.name,
          serviceName: service.name,
          quantity: 1,
          unitPrice: Number(service.price),
          discountAmount: 0,
          taxPercent: 0,
          taxAmount: 0,
          lineTotal: Number(service.price),
        })),
      },
      tx
    );
    await createAuditLog({
      tx,
      salonId,
      branchId,
      userId: actor.userId,
      module: "JOB_CART",
      action: "CREATE",
      entityId: appointment.id,
      entityCode: appointment.appointmentCode,
      entityName: customer.name,
      description: `Job cart ${appointment.appointmentCode} created`,
      newData: {
        customerId: customer.id,
        staffId: appointment.staffId,
        startTime: appointment.startTime,
        serviceIds: services.map((service) => service.id),
        invoiceId: invoice.id,
      },
      ...audit,
    });
    return present(await requireCart(tx, appointment.id, actor));
  });

export const updateJobCart = async (
  actor: JobCartActor,
  id: string,
  input: {
    customerName?: string;
    phone?: string;
    startTime?: Date;
    staffId?: string | null;
    bookingNote?: string | null;
    internalNote?: string | null;
  },
  audit: AuditContext
) =>
  prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Appointment" WHERE "id" = ${id} FOR UPDATE`;
    const existing = await requireCart(tx, id, actor);
    requireMutable(existing);
    const customer =
      input.customerName || input.phone
        ? await resolveCustomer(tx, {
            salonId: existing.salonId,
            branchId: existing.branchId!,
            customerName: input.customerName ?? existing.customer.name,
            phone: input.phone ?? existing.customer.phone ?? "",
          })
        : await tx.customer.findUniqueOrThrow({
            where: { id: existing.customer.id },
          });
    const staffId =
      input.staffId === undefined ? existing.staffId : input.staffId;
    await validateStaff(
      tx,
      existing.salonId,
      existing.branchId!,
      staffId
    );
    const startTime = input.startTime ?? existing.startTime;
    const endTime = new Date(
      startTime.getTime() +
        Math.max(existing.totalDurationMinutes, 30) * 60_000
    );
    await assertNoConflict(tx, {
      staffId,
      startTime,
      endTime,
      excludeAppointmentId: existing.id,
    });
    await tx.appointment.update({
      where: { id },
      data: {
        customerId: customer.id,
        staffId,
        startTime,
        endTime,
        ...(input.bookingNote !== undefined
          ? { bookingNote: input.bookingNote }
          : {}),
        ...(input.internalNote !== undefined
          ? { internalNote: input.internalNote }
          : {}),
      },
    });
    await tx.invoice.update({
      where: { id: existing.invoice!.id },
      data: {
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        customerGst: customer.gst,
      },
    });
    if (customer.id !== existing.customer.id) {
      await recalculateCart(tx, id);
    }
    await createAuditLog({
      tx,
      salonId: existing.salonId,
      branchId: existing.branchId,
      userId: actor.userId,
      module: "JOB_CART",
      action: "UPDATE",
      entityId: id,
      entityCode: existing.appointmentCode,
      entityName: customer.name,
      description: `Job cart ${existing.appointmentCode} updated`,
      oldData: {
        customerId: existing.customerId,
        staffId: existing.staffId,
        startTime: existing.startTime,
      },
      newData: { customerId: customer.id, staffId, startTime },
      ...audit,
    });
    return present(await requireCart(tx, id, actor));
  });

export const addJobCartItem = async (
  actor: JobCartActor,
  id: string,
  serviceId: string,
  audit: AuditContext
) =>
  prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Appointment" WHERE "id" = ${id} FOR UPDATE`;
    const existing = await requireCart(tx, id, actor);
    requireMutable(existing);
    const [service] = await validateServices(
      tx,
      existing.salonId,
      existing.branchId!,
      [serviceId]
    );
    if (!service) throw new JobCartError(400, "Service is unavailable");
    if (existing.services.some((item) => item.serviceId === service.id)) {
      throw new JobCartError(409, "Service is already in the job cart");
    }
    const item = await tx.appointmentService.create({
      data: {
        appointmentId: existing.id,
        serviceId: service.id,
        serviceName: service.name,
        price: service.price,
        durationValue: service.durationValue,
        durationUnit: service.durationUnit,
      },
    });
    await recalculateCart(tx, id);
    await createAuditLog({
      tx,
      salonId: existing.salonId,
      branchId: existing.branchId,
      userId: actor.userId,
      module: "JOB_CART",
      action: "UPDATE",
      entityId: id,
      entityCode: existing.appointmentCode,
      entityName: existing.customer.name,
      description: `Service ${service.name} added to job cart ${existing.appointmentCode}`,
      newData: {
        itemId: item.id,
        serviceId: service.id,
        serviceName: service.name,
        price: service.price,
      },
      ...audit,
    });
    return present(await requireCart(tx, id, actor));
  });

export const removeJobCartItem = async (
  actor: JobCartActor,
  id: string,
  itemId: string,
  audit: AuditContext
) =>
  prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Appointment" WHERE "id" = ${id} FOR UPDATE`;
    const existing = await requireCart(tx, id, actor);
    requireMutable(existing);
    const item = existing.services.find((service) => service.id === itemId);
    if (!item) throw new JobCartError(404, "Job cart item not found");
    await tx.appointmentService.delete({ where: { id: item.id } });
    await recalculateCart(tx, id);
    await createAuditLog({
      tx,
      salonId: existing.salonId,
      branchId: existing.branchId,
      userId: actor.userId,
      module: "JOB_CART",
      action: "DELETE",
      entityId: id,
      entityCode: existing.appointmentCode,
      entityName: existing.customer.name,
      description: `Service ${item.serviceName} removed from job cart ${existing.appointmentCode}`,
      oldData: {
        itemId: item.id,
        serviceId: item.serviceId,
        serviceName: item.serviceName,
        price: item.price,
      },
      ...audit,
    });
    return present(await requireCart(tx, id, actor));
  });

export const confirmJobCart = async (
  actor: JobCartActor,
  id: string,
  audit: AuditContext
) =>
  prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Appointment" WHERE "id" = ${id} FOR UPDATE`;
    const existing = await requireCart(tx, id, actor);
    requireMutable(existing);
    if (!existing.services.length || !existing.invoice?.items.length) {
      throw new JobCartError(400, "Add at least one service before confirming");
    }
    await assertNoConflict(tx, {
      staffId: existing.staffId,
      startTime: existing.startTime,
      endTime: existing.endTime,
      excludeAppointmentId: existing.id,
    });
    await AppointmentModel.updateStatusWithHistory(
      id,
      {
        oldStatus: existing.status,
        newStatus: "COMPLETED",
        note: "Walk-in job cart confirmed",
        changedById: actor.userId,
      },
      tx
    );
    await issueInvoice({
      invoiceId: existing.invoice.id,
      salonId: existing.salonId,
      userId: actor.userId,
      tx,
      allowWalkInJobCart: true,
      ...audit,
    });
    await createAuditLog({
      tx,
      salonId: existing.salonId,
      branchId: existing.branchId,
      userId: actor.userId,
      module: "JOB_CART",
      action: "COMPLETE",
      entityId: id,
      entityCode: existing.appointmentCode,
      entityName: existing.customer.name,
      description: `Job cart ${existing.appointmentCode} confirmed`,
      oldData: {
        appointmentStatus: existing.status,
        invoiceStatus: existing.invoice.status,
      },
      newData: {
        appointmentStatus: "COMPLETED",
        invoiceStatus: "ISSUED",
      },
      ...audit,
    });
    return present(await requireCart(tx, id, actor));
  });

export const cancelJobCart = async (
  actor: JobCartActor,
  id: string,
  audit: AuditContext
) =>
  prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Appointment" WHERE "id" = ${id} FOR UPDATE`;
    const existing = await requireCart(tx, id, actor);
    requireMutable(existing);
    const ledgerEntry = await tx.customerTransaction.findFirst({
      where: { invoiceId: existing.invoice!.id },
      select: { id: true },
    });
    if (ledgerEntry) {
      throw new JobCartError(
        409,
        "Job cart cannot be cancelled after ledger activity"
      );
    }
    await AppointmentModel.updateStatusWithHistory(
      id,
      {
        oldStatus: existing.status,
        newStatus: "CANCELLED",
        note: "Walk-in job cart cancelled",
        changedById: actor.userId,
      },
      tx
    );
    await InvoiceModel.cancel(existing.invoice!.id, tx);
    await createAuditLog({
      tx,
      salonId: existing.salonId,
      branchId: existing.branchId,
      userId: actor.userId,
      module: "JOB_CART",
      action: "CANCEL",
      entityId: id,
      entityCode: existing.appointmentCode,
      entityName: existing.customer.name,
      description: `Job cart ${existing.appointmentCode} cancelled`,
      oldData: {
        appointmentStatus: existing.status,
        invoiceStatus: existing.invoice!.status,
      },
      newData: {
        appointmentStatus: "CANCELLED",
        invoiceStatus: "CANCELLED",
      },
      ...audit,
    });
    return present(await requireCart(tx, id, actor));
  });
