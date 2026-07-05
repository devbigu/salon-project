import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import request from "supertest";
import { app } from "../app.js";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";

const tokenFor = (actor: {
  id: string;
  role: string;
  salonId?: string | null;
  branchId?: string | null;
}) =>
  jwt.sign(
    {
      userId: actor.id,
      role: actor.role,
      ...(actor.salonId ? { salonId: actor.salonId } : {}),
      ...(actor.branchId ? { branchId: actor.branchId } : {}),
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

const fixture = async () => {
  const marker = randomUUID();
  const salon = await prisma.salon.create({
    data: { name: `Package Salon ${marker}` },
  });
  const otherSalon = await prisma.salon.create({
    data: { name: `Other Package Salon ${marker}` },
  });
  const branch = await prisma.branch.create({
    data: { salonId: salon.id, name: `Package Main ${marker}` },
  });
  const otherBranch = await prisma.branch.create({
    data: { salonId: salon.id, name: `Package Other ${marker}` },
  });
  const admin = await prisma.user.create({
    data: {
      name: "Package Admin",
      email: `package-admin-${marker}@test.com`,
      passwordHash: "test",
      role: "SALON_ADMIN",
      salonId: salon.id,
    },
  });
  const foreignAdmin = await prisma.user.create({
    data: {
      name: "Foreign Package Admin",
      email: `foreign-package-admin-${marker}@test.com`,
      passwordHash: "test",
      role: "SALON_ADMIN",
      salonId: otherSalon.id,
    },
  });
  const receptionist = await prisma.user.create({
    data: {
      name: "Package Receptionist",
      email: `package-reception-${marker}@test.com`,
      passwordHash: "test",
      role: "RECEPTIONIST",
      salonId: salon.id,
      branchId: branch.id,
    },
  });
  const staffUser = await prisma.user.create({
    data: {
      name: "Package Staff User",
      email: `package-staff-${marker}@test.com`,
      passwordHash: "test",
      role: "STAFF",
      salonId: salon.id,
      branchId: branch.id,
    },
  });
  const stylist = await prisma.staff.create({
    data: {
      name: "Package Seller",
      email: `package-seller-${marker}@test.com`,
      jobRole: "Stylist",
      workingFrom: "09:00",
      workingTo: "18:00",
      weekOff: "Sunday",
      salonId: salon.id,
      branchId: branch.id,
    },
  });
  const mainService = await prisma.mainService.create({
    data: { salonId: salon.id, name: `Package Services ${marker}` },
  });
  const service = await prisma.service.create({
    data: {
      salonId: salon.id,
      branchId: branch.id,
      mainServiceId: mainService.id,
      name: `Package Facial ${marker}`,
      price: 600,
      durationValue: 45,
    },
  });
  const service2 = await prisma.service.create({
    data: {
      salonId: salon.id,
      branchId: branch.id,
      mainServiceId: mainService.id,
      name: `Package Cleanup ${marker}`,
      price: 400,
      durationValue: 30,
    },
  });
  return {
    salon,
    otherSalon,
    branch,
    otherBranch,
    adminToken: tokenFor(admin),
    foreignAdminToken: tokenFor(foreignAdmin),
    receptionistToken: tokenFor(receptionist),
    staffToken: tokenFor(staffUser),
    stylist,
    service,
    service2,
  };
};

const createCategory = async (
  fixtureData: Awaited<ReturnType<typeof fixture>>,
  name = `Skin ${randomUUID()}`
) =>
  request(app)
    .post("/api/package-categories")
    .set(auth(fixtureData.adminToken))
    .send({ name, branchId: fixtureData.branch.id });

const createPackage = async (
  fixtureData: Awaited<ReturnType<typeof fixture>>,
  categoryId: string,
  overrides: Record<string, unknown> = {}
) =>
  request(app)
    .post("/api/packages")
    .set(auth(fixtureData.adminToken))
    .send({
      categoryId,
      branchId: fixtureData.branch.id,
      name: `Glow Bundle ${randomUUID()}`,
      serviceIds: [fixtureData.service.id, fixtureData.service2.id],
      specialPrice: 800,
      validityDays: 30,
      ...overrides,
    });

describe("Service packages", () => {
  it("creates, updates, filters, and changes package category status with tenant isolation", async () => {
    const f = await fixture();
    const name = `Skin ${randomUUID()}`;
    const created = await createCategory(f, name);
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({
      name,
      status: "ACTIVE",
      salonId: f.salon.id,
    });

    expect((await createCategory(f, name)).status).toBe(409);
    const foreign = await request(app)
      .post("/api/package-categories")
      .set(auth(f.foreignAdminToken))
      .send({ name });
    expect(foreign.status).toBe(201);

    const updated = await request(app)
      .put(`/api/package-categories/${created.body.data.id}`)
      .set(auth(f.adminToken))
      .send({ name: `${name} Updated`, branchId: f.branch.id });
    expect(updated.status).toBe(200);

    await request(app)
      .patch(`/api/package-categories/${created.body.data.id}/status`)
      .set(auth(f.adminToken))
      .send({ status: "INACTIVE" })
      .expect(200);
    await request(app)
      .get(`/api/package-categories/${created.body.data.id}`)
      .set(auth(f.foreignAdminToken))
      .expect(404);

    const filtered = await request(app)
      .get("/api/package-categories")
      .query({ status: "INACTIVE", search: "Updated", page: 1, limit: 5 })
      .set(auth(f.adminToken));
    expect(filtered.status).toBe(200);
    expect(filtered.body.pagination.total).toBe(1);
  });

  it("calculates package total from service snapshots and validates services and pricing", async () => {
    const f = await fixture();
    const category = await createCategory(f);
    const created = await createPackage(f, category.body.data.id);
    expect(created.status).toBe(201);
    expect(Number(created.body.data.totalPrice)).toBe(1000);
    expect(Number(created.body.data.specialPrice)).toBe(800);
    expect(created.body.data.items).toHaveLength(2);

    expect((await createPackage(f, category.body.data.id, {
      name: `Empty ${randomUUID()}`,
      serviceIds: [],
    })).status).toBe(400);
    expect((await createPackage(f, category.body.data.id, {
      name: `Overpriced ${randomUUID()}`,
      specialPrice: 1001,
    })).status).toBe(400);

    const updated = await request(app)
      .put(`/api/packages/${created.body.data.id}`)
      .set(auth(f.adminToken))
      .send({
        categoryId: category.body.data.id,
        branchId: f.branch.id,
        name: created.body.data.name,
        serviceIds: [f.service.id],
        specialPrice: 500,
        validityDays: 45,
      });
    expect(updated.status).toBe(200);
    expect(Number(updated.body.data.totalPrice)).toBe(600);
    expect(updated.body.data.items).toHaveLength(1);
  });

  it("enforces package RBAC and only exposes active packages to receptionists", async () => {
    const f = await fixture();
    const category = await createCategory(f);
    const servicePackage = await createPackage(f, category.body.data.id);
    await request(app)
      .post("/api/packages")
      .set(auth(f.staffToken))
      .send({})
      .expect(403);
    await request(app)
      .patch(`/api/packages/${servicePackage.body.data.id}/status`)
      .set(auth(f.adminToken))
      .send({ status: "INACTIVE" })
      .expect(200);
    const receptionistList = await request(app)
      .get("/api/packages")
      .set(auth(f.receptionistToken));
    expect(receptionistList.status).toBe(200);
    expect(receptionistList.body.data).toHaveLength(0);
  });

  it("adds and removes a package while preserving draft invoice calculations", async () => {
    const f = await fixture();
    const category = await createCategory(f);
    const servicePackage = await createPackage(f, category.body.data.id);
    const cart = await request(app)
      .post("/api/job-carts")
      .set(auth(f.adminToken))
      .send({
        branchId: f.branch.id,
        customerName: "Package Buyer",
        phone: "9876501001",
        startTime: "2039-01-01T10:00:00.000Z",
        serviceIds: [],
      });
    expect(cart.status).toBe(201);
    const added = await request(app)
      .post(`/api/job-carts/${cart.body.data.id}/items`)
      .set(auth(f.adminToken))
      .send({
        itemType: "PACKAGE",
        packageId: servicePackage.body.data.id,
        staffId: f.stylist.id,
      });
    expect(added.status).toBe(200);
    const item = added.body.data.items.find(
      (value: { itemType: string }) => value.itemType === "PACKAGE"
    );
    expect(item.soldByStaffId).toBe(f.stylist.id);
    expect(Number(added.body.data.invoice.totalAmount)).toBe(800);

    const removed = await request(app)
      .delete(`/api/job-carts/${cart.body.data.id}/items/${item.id}`)
      .set(auth(f.adminToken));
    expect(removed.status).toBe(200);
    expect(Number(removed.body.data.invoice.totalAmount)).toBe(0);
  });

  it("confirms a prepaid package sale, exposes it in summary, and cancels it with the invoice", async () => {
    const f = await fixture();
    const category = await createCategory(f);
    const servicePackage = await createPackage(f, category.body.data.id, {
      validityDays: 60,
    });
    const cart = await request(app)
      .post("/api/job-carts")
      .set(auth(f.receptionistToken))
      .send({
        branchId: f.branch.id,
        customerName: "Summary Package Buyer",
        phone: "9876501002",
        startTime: "2039-02-01T10:00:00.000Z",
        serviceIds: [],
      });
    await request(app)
      .post(`/api/job-carts/${cart.body.data.id}/items`)
      .set(auth(f.receptionistToken))
      .send({
        itemType: "PACKAGE",
        packageId: servicePackage.body.data.id,
        staffId: f.stylist.id,
      })
      .expect(200);
    const confirmed = await request(app)
      .post(`/api/job-carts/${cart.body.data.id}/confirm`)
      .set(auth(f.receptionistToken));
    expect(confirmed.status).toBe(200);

    const purchased = await prisma.customerPackage.findFirstOrThrow({
      where: { invoiceId: confirmed.body.data.invoice.id },
    });
    expect(purchased.status).toBe("ACTIVE");
    expect(purchased.soldByStaffId).toBe(f.stylist.id);
    expect(
      Math.round(
        (purchased.validUntil.getTime() - purchased.purchasedAt.getTime()) /
          86_400_000
      )
    ).toBe(60);

    const summary = await request(app)
      .get("/api/job-carts/customer-summary")
      .query({ customerId: cart.body.data.customerId })
      .set(auth(f.receptionistToken));
    expect(summary.status).toBe(200);
    expect(summary.body.data.activePackages[0]).toMatchObject({
      customerPackageId: purchased.id,
      packageName: purchased.packageNameSnapshot,
      soldByStaffName: f.stylist.name,
    });

    await request(app)
      .patch(`/api/invoices/${confirmed.body.data.invoice.id}/cancel`)
      .set(auth(f.adminToken))
      .expect(200);
    expect(
      (
        await prisma.customerPackage.findUniqueOrThrow({
          where: { id: purchased.id },
        })
      ).status
    ).toBe("CANCELLED");
  });

  it("rejects inactive, foreign-tenant, and wrong-branch package sales", async () => {
    const f = await fixture();
    const category = await createCategory(f);
    const servicePackage = await createPackage(f, category.body.data.id);
    const cart = await request(app)
      .post("/api/job-carts")
      .set(auth(f.adminToken))
      .send({
        branchId: f.otherBranch.id,
        customerName: "Wrong Branch Buyer",
        phone: "9876501003",
        startTime: "2039-03-01T10:00:00.000Z",
        serviceIds: [],
      });
    await request(app)
      .post(`/api/job-carts/${cart.body.data.id}/items`)
      .set(auth(f.adminToken))
      .send({
        itemType: "PACKAGE",
        packageId: servicePackage.body.data.id,
      })
      .expect(400);

    await request(app)
      .patch(`/api/packages/${servicePackage.body.data.id}/status`)
      .set(auth(f.adminToken))
      .send({ status: "INACTIVE" })
      .expect(200);
    const branchCart = await request(app)
      .post("/api/job-carts")
      .set(auth(f.adminToken))
      .send({
        branchId: f.branch.id,
        customerName: "Inactive Buyer",
        phone: "9876501004",
        startTime: "2039-03-02T10:00:00.000Z",
        serviceIds: [],
      });
    await request(app)
      .post(`/api/job-carts/${branchCart.body.data.id}/items`)
      .set(auth(f.adminToken))
      .send({
        itemType: "PACKAGE",
        packageId: servicePackage.body.data.id,
      })
      .expect(400);
  });

  it("rolls back package creation when its transactional audit fails", async () => {
    const f = await fixture();
    const category = await createCategory(f);
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION fail_package_create_audit()
      RETURNS trigger AS $$
      BEGIN
        IF NEW."module" = 'PACKAGE' AND NEW."action" = 'CREATE'
           AND NEW."description" LIKE 'Package % created' THEN
          RAISE EXCEPTION 'forced package create audit failure';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    await prisma.$executeRawUnsafe(
      `DROP TRIGGER IF EXISTS fail_package_create_audit_trigger ON "AuditLog"`
    );
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER fail_package_create_audit_trigger
      BEFORE INSERT ON "AuditLog"
      FOR EACH ROW EXECUTE FUNCTION fail_package_create_audit()
    `);
    const name = `Rollback Package ${randomUUID()}`;
    try {
      const response = await createPackage(f, category.body.data.id, { name });
      expect(response.status).toBe(500);
      expect(
        await prisma.servicePackage.count({
          where: { salonId: f.salon.id, name },
        })
      ).toBe(0);
    } finally {
      await prisma.$executeRawUnsafe(
        `DROP TRIGGER IF EXISTS fail_package_create_audit_trigger ON "AuditLog"`
      );
      await prisma.$executeRawUnsafe(
        `DROP FUNCTION IF EXISTS fail_package_create_audit()`
      );
    }
  });

  it("rolls back package entitlement and invoice issue when confirmation audit fails", async () => {
    const f = await fixture();
    const category = await createCategory(f);
    const servicePackage = await createPackage(f, category.body.data.id);
    const cart = await request(app)
      .post("/api/job-carts")
      .set(auth(f.adminToken))
      .send({
        branchId: f.branch.id,
        customerName: "Rollback Buyer",
        phone: "9876501099",
        startTime: "2039-04-01T10:00:00.000Z",
        serviceIds: [],
      });
    await request(app)
      .post(`/api/job-carts/${cart.body.data.id}/items`)
      .set(auth(f.adminToken))
      .send({
        itemType: "PACKAGE",
        packageId: servicePackage.body.data.id,
      })
      .expect(200);
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION fail_customer_package_audit()
      RETURNS trigger AS $$
      BEGIN
        IF NEW."module" = 'PACKAGE' AND NEW."action" = 'CREATE'
           AND NEW."description" LIKE 'Customer package %' THEN
          RAISE EXCEPTION 'forced customer package audit failure';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    await prisma.$executeRawUnsafe(
      `DROP TRIGGER IF EXISTS fail_customer_package_audit_trigger ON "AuditLog"`
    );
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER fail_customer_package_audit_trigger
      BEFORE INSERT ON "AuditLog"
      FOR EACH ROW EXECUTE FUNCTION fail_customer_package_audit()
    `);
    try {
      await request(app)
        .post(`/api/job-carts/${cart.body.data.id}/confirm`)
        .set(auth(f.adminToken))
        .expect(500);
      const unchanged = await prisma.appointment.findUniqueOrThrow({
        where: { id: cart.body.data.id },
        include: { invoice: true },
      });
      expect(unchanged.status).toBe("SCHEDULED");
      expect(unchanged.invoice?.status).toBe("DRAFT");
      expect(
        await prisma.customerPackage.count({
          where: { jobCartAppointmentId: cart.body.data.id },
        })
      ).toBe(0);
    } finally {
      await prisma.$executeRawUnsafe(
        `DROP TRIGGER IF EXISTS fail_customer_package_audit_trigger ON "AuditLog"`
      );
      await prisma.$executeRawUnsafe(
        `DROP FUNCTION IF EXISTS fail_customer_package_audit()`
      );
    }
  });
});
