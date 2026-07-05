import { prisma } from "../../config/prisma.js";
import {
  Prisma,
  type CustomerPackageStatus,
  type PackageStatus,
} from "../../generated/prisma/client.js";
import { createAuditLog } from "../audit-logs/audit-log.service.js";

type TransactionClient = Prisma.TransactionClient;

export type PackageActor = {
  userId: string;
  role: string;
  salonId?: string;
  branchId?: string;
};

type AuditContext = { ipAddress?: string; userAgent?: string };

export class PackageError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "PackageError";
  }
}

const branchRoles = new Set(["BRANCH_MANAGER", "RECEPTIONIST"]);

const scope = (actor: PackageActor) => {
  if (actor.role === "SUPER_ADMIN") return {};
  if (!actor.salonId) return { salonId: "__unauthorized__" };
  return {
    salonId: actor.salonId,
    ...(branchRoles.has(actor.role)
      ? { OR: [{ branchId: null }, { branchId: actor.branchId ?? "__unauthorized__" }] }
      : {}),
  };
};

const managementScope = (actor: PackageActor) => {
  if (actor.role === "SUPER_ADMIN") return {};
  if (!actor.salonId) return { salonId: "__unauthorized__" };
  return {
    salonId: actor.salonId,
    ...(actor.role === "BRANCH_MANAGER"
      ? { branchId: actor.branchId ?? "__unauthorized__" }
      : {}),
  };
};

const writeScope = (
  actor: PackageActor,
  requestedSalonId?: string,
  requestedBranchId?: string | null
) => {
  const salonId =
    actor.role === "SUPER_ADMIN" ? requestedSalonId : actor.salonId;
  if (!salonId) throw new PackageError(400, "Salon is required");
  const branchId =
    actor.role === "BRANCH_MANAGER" ? actor.branchId : requestedBranchId;
  if (actor.role === "BRANCH_MANAGER" && !branchId) {
    throw new PackageError(400, "Branch is required");
  }
  return { salonId, branchId: branchId ?? null };
};

const assertBranch = async (
  tx: TransactionClient,
  salonId: string,
  branchId: string | null
) => {
  if (!branchId) return;
  const branch = await tx.branch.findFirst({
    where: { id: branchId, salonId, status: true },
    select: { id: true },
  });
  if (!branch) throw new PackageError(400, "Invalid branch");
};

const categoryInclude = {
  branch: { select: { id: true, name: true } },
  _count: { select: { packages: true } },
} as const;

const packageInclude = {
  category: { select: { id: true, name: true, status: true } },
  branch: { select: { id: true, name: true } },
  items: {
    include: {
      service: {
        select: {
          id: true,
          name: true,
          status: true,
          branchId: true,
          price: true,
        },
      },
    },
    orderBy: { createdAt: "asc" as const },
  },
  _count: { select: { customerPackages: true, invoiceItems: true } },
} as const;

const normalizeItems = (
  items?: Array<{ serviceId: string; quantity: number }>,
  serviceIds?: string[]
) =>
  items?.length
    ? items
    : (serviceIds ?? []).map((serviceId) => ({ serviceId, quantity: 1 }));

const serviceDurationMinutes = (service: {
  durationValue: number | null;
  durationUnit: "MINUTES" | "HOURS";
}) =>
  service.durationValue === null
    ? null
    : service.durationValue * (service.durationUnit === "HOURS" ? 60 : 1);

const resolvePackageItems = async (
  tx: TransactionClient,
  salonId: string,
  branchId: string | null,
  rawItems: Array<{ serviceId: string; quantity: number }>
) => {
  const ids = rawItems.map((item) => item.serviceId);
  if (new Set(ids).size !== ids.length) {
    throw new PackageError(400, "Duplicate services are not allowed");
  }
  const services = await tx.service.findMany({
    where: {
      id: { in: ids },
      salonId,
      status: true,
      ...(branchId ? { OR: [{ branchId: null }, { branchId }] } : {}),
    },
  });
  if (services.length !== ids.length) {
    throw new PackageError(
      400,
      "Services must belong to the package salon and branch"
    );
  }
  const byId = new Map(services.map((service) => [service.id, service]));
  const items = rawItems.map((item) => ({
    service: byId.get(item.serviceId)!,
    quantity: item.quantity,
  }));
  const totalPrice = items.reduce(
    (total, item) =>
      total.add(item.service.price.mul(item.quantity)),
    new Prisma.Decimal(0)
  );
  return { items, totalPrice: totalPrice.toDecimalPlaces(2) };
};

export const listPackageCategories = async (
  actor: PackageActor,
  filters: {
    page: number;
    limit: number;
    search?: string | undefined;
    status?: PackageStatus | undefined;
    salonId?: string | undefined;
    branchId?: string | undefined;
  }
) => {
  const where: Prisma.PackageCategoryWhereInput = {
    ...scope(actor),
    ...(actor.role === "SUPER_ADMIN" && filters.salonId
      ? { salonId: filters.salonId }
      : {}),
    ...(filters.branchId ? { branchId: filters.branchId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.search
      ? { name: { contains: filters.search, mode: "insensitive" } }
      : {}),
    ...(actor.role === "RECEPTIONIST" ? { status: "ACTIVE" } : {}),
  };
  const [total, data] = await Promise.all([
    prisma.packageCategory.count({ where }),
    prisma.packageCategory.findMany({
      where,
      include: categoryInclude,
      orderBy: { name: "asc" },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
  ]);
  return {
    data,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / filters.limit)),
    },
  };
};

export const getPackageCategory = async (
  actor: PackageActor,
  id: string
) => {
  const data = await prisma.packageCategory.findFirst({
    where: {
      id,
      ...scope(actor),
      ...(actor.role === "RECEPTIONIST" ? { status: "ACTIVE" } : {}),
    },
    include: categoryInclude,
  });
  if (!data) throw new PackageError(404, "Package category not found");
  return data;
};

export const createPackageCategory = async (
  actor: PackageActor,
  input: {
    salonId?: string | undefined;
    branchId?: string | null | undefined;
    name: string;
    status?: PackageStatus | undefined;
  },
  audit: AuditContext
) =>
  prisma.$transaction(async (tx) => {
    const target = writeScope(actor, input.salonId, input.branchId);
    await assertBranch(tx, target.salonId, target.branchId);
    const duplicate = await tx.packageCategory.findFirst({
      where: {
        salonId: target.salonId,
        name: { equals: input.name, mode: "insensitive" },
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new PackageError(
        409,
        "Package category name already exists in this salon"
      );
    }
    const created = await tx.packageCategory.create({
      data: {
        salonId: target.salonId,
        branchId: target.branchId,
        name: input.name,
        status: input.status ?? "ACTIVE",
        createdById: actor.userId,
      },
      include: categoryInclude,
    });
    await createAuditLog({
      tx,
      salonId: created.salonId,
      branchId: created.branchId,
      userId: actor.userId,
      module: "PACKAGE",
      action: "CREATE",
      entityId: created.id,
      entityName: created.name,
      description: `Package category ${created.name} created`,
      newData: created,
      ...audit,
    });
    return created;
  });

export const updatePackageCategory = async (
  actor: PackageActor,
  id: string,
  input: {
    branchId?: string | null | undefined;
    name: string;
    status?: PackageStatus | undefined;
  },
  audit: AuditContext
) =>
  prisma.$transaction(async (tx) => {
    const existing = await tx.packageCategory.findFirst({
      where: { id, ...managementScope(actor) },
      include: categoryInclude,
    });
    if (!existing) throw new PackageError(404, "Package category not found");
    const branchId =
      actor.role === "BRANCH_MANAGER"
        ? actor.branchId ?? null
        : input.branchId === undefined
          ? existing.branchId
          : input.branchId;
    await assertBranch(tx, existing.salonId, branchId);
    const duplicate = await tx.packageCategory.findFirst({
      where: {
        salonId: existing.salonId,
        id: { not: id },
        name: { equals: input.name, mode: "insensitive" },
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new PackageError(
        409,
        "Package category name already exists in this salon"
      );
    }
    const updated = await tx.packageCategory.update({
      where: { id },
      data: {
        name: input.name,
        branchId,
        ...(input.status ? { status: input.status } : {}),
      },
      include: categoryInclude,
    });
    await createAuditLog({
      tx,
      salonId: existing.salonId,
      branchId: updated.branchId,
      userId: actor.userId,
      module: "PACKAGE",
      action: "UPDATE",
      entityId: id,
      entityName: updated.name,
      description: `Package category ${updated.name} updated`,
      oldData: existing,
      newData: updated,
      ...audit,
    });
    return updated;
  });

export const setPackageCategoryStatus = async (
  actor: PackageActor,
  id: string,
  status: PackageStatus,
  audit: AuditContext
) =>
  prisma.$transaction(async (tx) => {
    const existing = await tx.packageCategory.findFirst({
      where: { id, ...managementScope(actor) },
    });
    if (!existing) throw new PackageError(404, "Package category not found");
    const updated = await tx.packageCategory.update({
      where: { id },
      data: { status },
      include: categoryInclude,
    });
    await createAuditLog({
      tx,
      salonId: existing.salonId,
      branchId: existing.branchId,
      userId: actor.userId,
      module: "PACKAGE",
      action: "STATUS_CHANGE",
      entityId: id,
      entityName: existing.name,
      description: `Package category ${existing.name} ${status.toLowerCase()}`,
      oldData: { status: existing.status },
      newData: { status },
      ...audit,
    });
    return updated;
  });

export const deletePackageCategory = async (
  actor: PackageActor,
  id: string,
  audit: AuditContext
) =>
  prisma.$transaction(async (tx) => {
    const existing = await tx.packageCategory.findFirst({
      where: { id, ...managementScope(actor) },
      include: categoryInclude,
    });
    if (!existing) throw new PackageError(404, "Package category not found");
    const softDeleted = existing._count.packages > 0;
    if (softDeleted) {
      await tx.packageCategory.update({
        where: { id },
        data: { status: "INACTIVE" },
      });
    } else {
      await tx.packageCategory.delete({ where: { id } });
    }
    await createAuditLog({
      tx,
      salonId: existing.salonId,
      branchId: existing.branchId,
      userId: actor.userId,
      module: "PACKAGE",
      action: "DELETE",
      entityId: id,
      entityName: existing.name,
      description: `Package category ${existing.name} ${softDeleted ? "deactivated" : "deleted"}`,
      oldData: existing,
      ...audit,
    });
    return { softDeleted };
  });

export const listServicePackages = async (
  actor: PackageActor,
  filters: {
    page: number;
    limit: number;
    search?: string | undefined;
    status?: PackageStatus | undefined;
    categoryId?: string | undefined;
    salonId?: string | undefined;
    branchId?: string | undefined;
  }
) => {
  const where: Prisma.ServicePackageWhereInput = {
    ...scope(actor),
    ...(actor.role === "SUPER_ADMIN" && filters.salonId
      ? { salonId: filters.salonId }
      : {}),
    ...(filters.branchId ? { branchId: filters.branchId } : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" } },
            {
              description: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
    ...(actor.role === "RECEPTIONIST" ? { status: "ACTIVE" } : {}),
  };
  const [total, data] = await Promise.all([
    prisma.servicePackage.count({ where }),
    prisma.servicePackage.findMany({
      where,
      include: packageInclude,
      orderBy: { name: "asc" },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
  ]);
  return {
    data,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / filters.limit)),
    },
  };
};

export const getServicePackage = async (actor: PackageActor, id: string) => {
  const data = await prisma.servicePackage.findFirst({
    where: {
      id,
      ...scope(actor),
      ...(actor.role === "RECEPTIONIST" ? { status: "ACTIVE" } : {}),
    },
    include: packageInclude,
  });
  if (!data) throw new PackageError(404, "Package not found");
  return data;
};

export const createServicePackage = async (
  actor: PackageActor,
  input: {
    salonId?: string | undefined;
    branchId?: string | null | undefined;
    categoryId: string;
    name: string;
    description?: string | null | undefined;
    specialPrice: number;
    validityDays: number;
    status?: PackageStatus | undefined;
    items?: Array<{ serviceId: string; quantity: number }> | undefined;
    serviceIds?: string[] | undefined;
  },
  audit: AuditContext
) =>
  prisma.$transaction(async (tx) => {
    const target = writeScope(actor, input.salonId, input.branchId);
    await assertBranch(tx, target.salonId, target.branchId);
    const category = await tx.packageCategory.findFirst({
      where: {
        id: input.categoryId,
        salonId: target.salonId,
        status: "ACTIVE",
        ...(target.branchId
          ? { OR: [{ branchId: null }, { branchId: target.branchId }] }
          : {}),
      },
    });
    if (!category) throw new PackageError(400, "Invalid package category");
    const duplicate = await tx.servicePackage.findFirst({
      where: {
        salonId: target.salonId,
        name: { equals: input.name, mode: "insensitive" },
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new PackageError(409, "Package name already exists in this salon");
    }
    const resolved = await resolvePackageItems(
      tx,
      target.salonId,
      target.branchId,
      normalizeItems(input.items, input.serviceIds)
    );
    if (new Prisma.Decimal(input.specialPrice).gt(resolved.totalPrice)) {
      throw new PackageError(
        400,
        "Special price cannot exceed total price"
      );
    }
    const created = await tx.servicePackage.create({
      data: {
        salonId: target.salonId,
        branchId: target.branchId,
        categoryId: category.id,
        name: input.name,
        description: input.description ?? null,
        totalPrice: resolved.totalPrice,
        specialPrice: input.specialPrice,
        validityDays: input.validityDays,
        status: input.status ?? "ACTIVE",
        createdById: actor.userId,
        items: {
          create: resolved.items.map(({ service, quantity }) => ({
            salonId: target.salonId,
            serviceId: service.id,
            serviceNameSnapshot: service.name,
            quantity,
            priceSnapshot: service.price,
            durationMinutesSnapshot: serviceDurationMinutes(service),
          })),
        },
      },
      include: packageInclude,
    });
    await createAuditLog({
      tx,
      salonId: created.salonId,
      branchId: created.branchId,
      userId: actor.userId,
      module: "PACKAGE",
      action: "CREATE",
      entityId: created.id,
      entityName: created.name,
      description: `Package ${created.name} created`,
      newData: created,
      ...audit,
    });
    return created;
  });

export const updateServicePackage = async (
  actor: PackageActor,
  id: string,
  input: {
    branchId?: string | null | undefined;
    categoryId: string;
    name: string;
    description?: string | null | undefined;
    specialPrice: number;
    validityDays: number;
    status?: PackageStatus | undefined;
    items?: Array<{ serviceId: string; quantity: number }> | undefined;
    serviceIds?: string[] | undefined;
  },
  audit: AuditContext
) =>
  prisma.$transaction(async (tx) => {
    const existing = await tx.servicePackage.findFirst({
      where: { id, ...managementScope(actor) },
      include: packageInclude,
    });
    if (!existing) throw new PackageError(404, "Package not found");
    const branchId =
      actor.role === "BRANCH_MANAGER"
        ? actor.branchId ?? null
        : input.branchId === undefined
          ? existing.branchId
          : input.branchId;
    await assertBranch(tx, existing.salonId, branchId);
    const category = await tx.packageCategory.findFirst({
      where: {
        id: input.categoryId,
        salonId: existing.salonId,
        status: "ACTIVE",
        ...(branchId
          ? { OR: [{ branchId: null }, { branchId }] }
          : {}),
      },
    });
    if (!category) throw new PackageError(400, "Invalid package category");
    const duplicate = await tx.servicePackage.findFirst({
      where: {
        salonId: existing.salonId,
        id: { not: id },
        name: { equals: input.name, mode: "insensitive" },
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new PackageError(409, "Package name already exists in this salon");
    }
    const resolved = await resolvePackageItems(
      tx,
      existing.salonId,
      branchId,
      normalizeItems(input.items, input.serviceIds)
    );
    if (new Prisma.Decimal(input.specialPrice).gt(resolved.totalPrice)) {
      throw new PackageError(
        400,
        "Special price cannot exceed total price"
      );
    }
    await tx.servicePackageItem.deleteMany({ where: { packageId: id } });
    const updated = await tx.servicePackage.update({
      where: { id },
      data: {
        branchId,
        categoryId: category.id,
        name: input.name,
        description: input.description ?? null,
        totalPrice: resolved.totalPrice,
        specialPrice: input.specialPrice,
        validityDays: input.validityDays,
        ...(input.status ? { status: input.status } : {}),
        items: {
          create: resolved.items.map(({ service, quantity }) => ({
            salonId: existing.salonId,
            serviceId: service.id,
            serviceNameSnapshot: service.name,
            quantity,
            priceSnapshot: service.price,
            durationMinutesSnapshot: serviceDurationMinutes(service),
          })),
        },
      },
      include: packageInclude,
    });
    await createAuditLog({
      tx,
      salonId: existing.salonId,
      branchId: updated.branchId,
      userId: actor.userId,
      module: "PACKAGE",
      action: "UPDATE",
      entityId: id,
      entityName: updated.name,
      description: `Package ${updated.name} updated`,
      oldData: existing,
      newData: updated,
      ...audit,
    });
    return updated;
  });

export const setServicePackageStatus = async (
  actor: PackageActor,
  id: string,
  status: PackageStatus,
  audit: AuditContext
) =>
  prisma.$transaction(async (tx) => {
    const existing = await tx.servicePackage.findFirst({
      where: { id, ...managementScope(actor) },
    });
    if (!existing) throw new PackageError(404, "Package not found");
    const updated = await tx.servicePackage.update({
      where: { id },
      data: { status },
      include: packageInclude,
    });
    await createAuditLog({
      tx,
      salonId: existing.salonId,
      branchId: existing.branchId,
      userId: actor.userId,
      module: "PACKAGE",
      action: "STATUS_CHANGE",
      entityId: id,
      entityName: existing.name,
      description: `Package ${existing.name} ${status.toLowerCase()}`,
      oldData: { status: existing.status },
      newData: { status },
      ...audit,
    });
    return updated;
  });

export const deleteServicePackage = async (
  actor: PackageActor,
  id: string,
  audit: AuditContext
) =>
  prisma.$transaction(async (tx) => {
    const existing = await tx.servicePackage.findFirst({
      where: { id, ...managementScope(actor) },
      include: packageInclude,
    });
    if (!existing) throw new PackageError(404, "Package not found");
    const softDeleted =
      existing._count.customerPackages > 0 ||
      existing._count.invoiceItems > 0;
    if (softDeleted) {
      await tx.servicePackage.update({
        where: { id },
        data: { status: "INACTIVE" },
      });
    } else {
      await tx.servicePackage.delete({ where: { id } });
    }
    await createAuditLog({
      tx,
      salonId: existing.salonId,
      branchId: existing.branchId,
      userId: actor.userId,
      module: "PACKAGE",
      action: "DELETE",
      entityId: id,
      entityName: existing.name,
      description: `Package ${existing.name} ${softDeleted ? "deactivated" : "deleted"}`,
      oldData: existing,
      ...audit,
    });
    return { softDeleted };
  });

const customerPackageInclude = {
  package: {
    select: { id: true, name: true, categoryId: true },
  },
  customer: { select: { id: true, name: true, phone: true } },
  soldByStaff: { select: { id: true, name: true } },
  invoice: { select: { id: true, invoiceCode: true, status: true } },
} as const;

const expireCustomerPackages = async (
  where: Prisma.CustomerPackageWhereInput
) =>
  prisma.customerPackage.updateMany({
    where: {
      ...where,
      status: "ACTIVE",
      validUntil: { lt: new Date() },
    },
    data: { status: "EXPIRED" },
  });

export const listCustomerPackages = async (
  actor: PackageActor,
  filters: {
    page: number;
    limit: number;
    salonId?: string | undefined;
    branchId?: string | undefined;
    status?: CustomerPackageStatus | undefined;
    customerId?: string | undefined;
    packageId?: string | undefined;
  }
) => {
  const where: Prisma.CustomerPackageWhereInput = {
    ...scope(actor),
    ...(actor.role === "SUPER_ADMIN" && filters.salonId
      ? { salonId: filters.salonId }
      : {}),
    ...(filters.branchId ? { branchId: filters.branchId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.customerId ? { customerId: filters.customerId } : {}),
    ...(filters.packageId ? { packageId: filters.packageId } : {}),
  };
  await expireCustomerPackages(where);
  const [total, data] = await Promise.all([
    prisma.customerPackage.count({ where }),
    prisma.customerPackage.findMany({
      where,
      include: customerPackageInclude,
      orderBy: { purchasedAt: "desc" },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
  ]);
  return {
    data,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / filters.limit)),
    },
  };
};

export const getCustomerPackage = async (
  actor: PackageActor,
  id: string
) => {
  await expireCustomerPackages({ id, ...scope(actor) });
  const data = await prisma.customerPackage.findFirst({
    where: { id, ...scope(actor) },
    include: customerPackageInclude,
  });
  if (!data) throw new PackageError(404, "Customer package not found");
  return data;
};

export const setCustomerPackageStatus = async (
  actor: PackageActor,
  id: string,
  status: CustomerPackageStatus,
  audit: AuditContext
) =>
  prisma.$transaction(async (tx) => {
    const existing = await tx.customerPackage.findFirst({
      where: { id, ...managementScope(actor) },
    });
    if (!existing) throw new PackageError(404, "Customer package not found");
    const updated = await tx.customerPackage.update({
      where: { id },
      data: { status },
      include: customerPackageInclude,
    });
    await createAuditLog({
      tx,
      salonId: existing.salonId,
      branchId: existing.branchId,
      userId: actor.userId,
      module: "PACKAGE",
      action: "STATUS_CHANGE",
      entityId: id,
      entityName: existing.packageNameSnapshot,
      description: `Customer package ${existing.packageNameSnapshot} marked ${status.toLowerCase()}`,
      oldData: { status: existing.status },
      newData: { status },
      ...audit,
    });
    return updated;
  });
