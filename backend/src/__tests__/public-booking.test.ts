import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import request from "supertest";
import { app } from "../app.js";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { salonLocalDateTimeToUtc } from "../utils/timezone.js";

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

const futureDate = (days = 3) => {
  const date = new Date(Date.now() + days * 86_400_000);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getUTCDate()).padStart(2, "0")}`;
};

const fixture = async () => {
  const marker = randomUUID();
  const salon = await prisma.salon.create({
    data: {
      name: `Public Salon ${marker}`,
      timezone: "Asia/Kolkata",
    },
  });
  const otherSalon = await prisma.salon.create({
    data: { name: `Other Salon ${marker}` },
  });
  const branch = await prisma.branch.create({
    data: { name: `Main ${marker}`, salonId: salon.id },
  });
  const otherBranch = await prisma.branch.create({
    data: { name: `Other ${marker}`, salonId: otherSalon.id },
  });
  const category = await prisma.mainService.create({
    data: { name: `Hair ${marker}`, salonId: salon.id },
  });
  const otherCategory = await prisma.mainService.create({
    data: { name: `Other Hair ${marker}`, salonId: otherSalon.id },
  });
  const activeService = await prisma.service.create({
    data: {
      name: `Cut ${marker}`,
      price: 500,
      durationValue: 30,
      durationUnit: "MINUTES",
      salonId: salon.id,
      branchId: branch.id,
      mainServiceId: category.id,
    },
  });
  const inactiveService = await prisma.service.create({
    data: {
      name: `Hidden ${marker}`,
      price: 700,
      durationValue: 30,
      status: false,
      salonId: salon.id,
      branchId: branch.id,
      mainServiceId: category.id,
    },
  });
  const otherService = await prisma.service.create({
    data: {
      name: `Secret ${marker}`,
      price: 900,
      durationValue: 30,
      salonId: otherSalon.id,
      branchId: otherBranch.id,
      mainServiceId: otherCategory.id,
    },
  });
  const staff = await prisma.staff.create({
    data: {
      name: `Stylist ${marker}`,
      email: `${marker}@staff.test`,
      jobRole: "Stylist",
      workingFrom: "09:00",
      workingTo: "18:00",
      weekOff: "NEVER",
      salonId: salon.id,
      branchId: branch.id,
    },
  });
  const inactiveStaff = await prisma.staff.create({
    data: {
      name: `Inactive ${marker}`,
      email: `inactive-${marker}@staff.test`,
      jobRole: "Stylist",
      workingFrom: "09:00",
      workingTo: "18:00",
      weekOff: "NEVER",
      status: false,
      salonId: salon.id,
      branchId: branch.id,
    },
  });
  const setting = await prisma.publicBookingSetting.create({
    data: {
      salonId: salon.id,
      slug: `public-${marker}`,
      isEnabled: true,
      minNoticeMinutes: 0,
      bookingWindowDays: 30,
      slotIntervalMinutes: 15,
    },
  });
  const admin = await prisma.user.create({
    data: {
      name: "Public Admin",
      email: `admin-${marker}@test.com`,
      passwordHash: "test",
      role: "SALON_ADMIN",
      salonId: salon.id,
    },
  });
  const manager = await prisma.user.create({
    data: {
      name: "Branch Manager",
      email: `manager-${marker}@test.com`,
      passwordHash: "test",
      role: "BRANCH_MANAGER",
      salonId: salon.id,
      branchId: branch.id,
    },
  });
  return {
    salon,
    otherSalon,
    branch,
    otherBranch,
    activeService,
    inactiveService,
    otherService,
    staff,
    inactiveStaff,
    setting,
    adminToken: tokenFor(admin),
    managerToken: tokenFor(manager),
  };
};

describe("Public online booking", () => {
  it("serves enabled config and hides disabled config", async () => {
    const f = await fixture();
    const enabled = await request(app).get(
      `/api/public-booking/${f.setting.slug}/config`
    );
    expect(enabled.status).toBe(200);
    expect(enabled.body.data.salon).toMatchObject({
      id: f.salon.id,
      name: f.salon.name,
    });

    await prisma.publicBookingSetting.update({
      where: { id: f.setting.id },
      data: { isEnabled: false },
    });
    const disabled = await request(app).get(
      `/api/public-booking/${f.setting.slug}/config`
    );
    expect(disabled.status).toBe(404);
  });

  it("returns only active, tenant-safe services and active staff", async () => {
    const f = await fixture();
    const response = await request(app).get(
      `/api/public-booking/${f.setting.slug}/services`
    ).query({ branchId: f.branch.id });

    expect(response.status).toBe(200);
    expect(response.body.data.map((item: { id: string }) => item.id)).toEqual([
      f.activeService.id,
    ]);
    expect(response.body.staff.map((item: { id: string }) => item.id)).toEqual([
      f.staff.id,
    ]);
    expect(JSON.stringify(response.body)).not.toContain(f.otherService.id);
    expect(JSON.stringify(response.body)).not.toContain(f.inactiveStaff.email);
  });

  it("excludes conflicts and approved leave from available slots", async () => {
    const f = await fixture();
    const date = futureDate();
    const start = salonLocalDateTimeToUtc(date, "10:00", f.salon.timezone);
    const customer = await prisma.customer.create({
      data: {
        customerCode: `C-${randomUUID()}`,
        name: "Existing",
        phone: "9999990000",
        salonId: f.salon.id,
        branchId: f.branch.id,
      },
    });
    await prisma.appointment.create({
      data: {
        appointmentCode: `A-${randomUUID()}`,
        salonId: f.salon.id,
        branchId: f.branch.id,
        customerId: customer.id,
        staffId: f.staff.id,
        startTime: start,
        endTime: new Date(start.getTime() + 30 * 60_000),
        totalDurationMinutes: 30,
        estimatedAmount: 500,
      },
    });

    const response = await request(app)
      .get(`/api/public-booking/${f.setting.slug}/available-slots`)
      .query({
        branchId: f.branch.id,
        serviceIds: f.activeService.id,
        staffId: f.staff.id,
        date,
      });
    expect(response.status).toBe(200);
    expect(
      response.body.data.slots.some(
        (slot: { startTime: string }) => slot.startTime === start.toISOString()
      )
    ).toBe(false);
    expect(response.body.data.slots.length).toBeGreaterThan(0);

    await prisma.staffLeave.create({
      data: {
        salonId: f.salon.id,
        branchId: f.branch.id,
        staffId: f.staff.id,
        leaveType: "PAID_LEAVE",
        startDate: new Date(`${date}T00:00:00.000Z`),
        endDate: new Date(`${date}T00:00:00.000Z`),
        totalDays: 1,
        status: "APPROVED",
      },
    });
    const onLeave = await request(app)
      .get(`/api/public-booking/${f.setting.slug}/available-slots`)
      .query({
        branchId: f.branch.id,
        serviceIds: f.activeService.id,
        date,
      });
    expect(onLeave.body.data.slots).toHaveLength(0);
  });

  it("reuses a customer and creates an audited appointment", async () => {
    const f = await fixture();
    const existing = await prisma.customer.create({
      data: {
        customerCode: `C-${randomUUID()}`,
        name: "Returning Customer",
        phone: "+91 98765 43210",
        salonId: f.salon.id,
        branchId: f.branch.id,
      },
    });
    const date = futureDate();
    const start = salonLocalDateTimeToUtc(date, "11:00", f.salon.timezone);
    const response = await request(app)
      .post(`/api/public-booking/${f.setting.slug}/appointments`)
      .send({
        branchId: f.branch.id,
        customerName: "Returning Customer",
        customerPhone: "+91-98765-43210",
        customerEmail: "returning@test.com",
        serviceIds: [f.activeService.id],
        staffId: f.staff.id,
        startTime: start.toISOString(),
        note: "Window seat",
      });

    expect(response.status).toBe(201);
    const appointment = await prisma.appointment.findUnique({
      where: { id: response.body.data.id },
    });
    expect(appointment).toMatchObject({
      customerId: existing.id,
      staffId: f.staff.id,
      status: "SCHEDULED",
    });
    expect(await prisma.customer.count({ where: { salonId: f.salon.id } })).toBe(1);
    expect(
      await prisma.auditLog.count({
        where: { entityId: appointment?.id, module: "APPOINTMENT", action: "CREATE" },
      })
    ).toBe(1);
  });

  it("handles duplicate submissions without creating a second appointment", async () => {
    const f = await fixture();
    const date = futureDate();
    const body = {
      branchId: f.branch.id,
      customerName: "Duplicate Customer",
      customerPhone: "9876543999",
      serviceIds: [f.activeService.id],
      staffId: f.staff.id,
      startTime: salonLocalDateTimeToUtc(
        date,
        "12:00",
        f.salon.timezone
      ).toISOString(),
    };
    const first = await request(app)
      .post(`/api/public-booking/${f.setting.slug}/appointments`)
      .send(body);
    const second = await request(app)
      .post(`/api/public-booking/${f.setting.slug}/appointments`)
      .send(body);

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body.duplicate).toBe(true);
    expect(second.body.data.id).toBe(first.body.data.id);
    expect(await prisma.appointment.count()).toBe(1);
  });

  it("rejects unavailable slots, inactive services and inactive staff", async () => {
    const f = await fixture();
    const date = futureDate();
    const base = {
      branchId: f.branch.id,
      customerName: "Invalid Booking",
      customerPhone: "9876543998",
      serviceIds: [f.activeService.id],
      staffId: f.staff.id,
      startTime: salonLocalDateTimeToUtc(
        date,
        "08:00",
        f.salon.timezone
      ).toISOString(),
    };
    const unavailable = await request(app)
      .post(`/api/public-booking/${f.setting.slug}/appointments`)
      .send(base);
    expect(unavailable.status).toBe(409);

    const inactiveService = await request(app)
      .post(`/api/public-booking/${f.setting.slug}/appointments`)
      .send({
        ...base,
        serviceIds: [f.inactiveService.id],
        startTime: salonLocalDateTimeToUtc(
          date,
          "13:00",
          f.salon.timezone
        ).toISOString(),
      });
    expect(inactiveService.status).toBe(400);

    const inactiveStaff = await request(app)
      .post(`/api/public-booking/${f.setting.slug}/appointments`)
      .send({
        ...base,
        staffId: f.inactiveStaff.id,
        startTime: salonLocalDateTimeToUtc(
          date,
          "14:00",
          f.salon.timezone
        ).toISOString(),
      });
    expect(inactiveStaff.status).toBe(400);
  });

  it("rate limits the public creation endpoint", async () => {
    const f = await fixture();
    let last: request.Response | undefined;
    for (let index = 0; index < 11; index += 1) {
      last = await request(app)
        .post(`/api/public-booking/${f.setting.slug}/appointments`)
        .set("x-test-rate-limit", "enforce")
        .send({});
    }
    expect(last?.status).toBe(429);
  });

  it("supports admin CRUD and limits a branch manager to their branch", async () => {
    const f = await fixture();
    const list = await request(app)
      .get("/api/public-booking-settings")
      .set(auth(f.adminToken));
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);

    const update = await request(app)
      .put(`/api/public-booking-settings/${f.setting.id}`)
      .set(auth(f.adminToken))
      .send({ bookingWindowDays: 45, requireApproval: true });
    expect(update.status).toBe(200);
    expect(update.body.data).toMatchObject({
      bookingWindowDays: 45,
      requireApproval: true,
    });

    const forbidden = await request(app)
      .put(`/api/public-booking-settings/${f.setting.id}`)
      .set(auth(f.managerToken))
      .send({ branchId: f.otherBranch.id });
    expect(forbidden.status).toBe(404);

    const branchSetting = await request(app)
      .post("/api/public-booking-settings")
      .set(auth(f.managerToken))
      .send({ slug: `branch-${randomUUID()}` });
    expect(branchSetting.status).toBe(201);
    expect(branchSetting.body.data.branchId).toBe(f.branch.id);
  });

  it("rolls back a setting update when its transactional audit fails", async () => {
    const f = await fixture();
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION fail_public_booking_audit()
      RETURNS trigger AS $$
      BEGIN
        IF NEW."module" = 'PUBLIC_BOOKING' THEN
          RAISE EXCEPTION 'forced public booking audit failure';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    await prisma.$executeRawUnsafe(
      `DROP TRIGGER IF EXISTS fail_public_booking_audit_trigger ON "AuditLog"`
    );
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER fail_public_booking_audit_trigger
      BEFORE INSERT ON "AuditLog"
      FOR EACH ROW EXECUTE FUNCTION fail_public_booking_audit()
    `);

    try {
      const response = await request(app)
        .put(`/api/public-booking-settings/${f.setting.id}`)
        .set(auth(f.adminToken))
        .send({ bookingWindowDays: 99 });
      expect(response.status).toBe(500);
      const unchanged = await prisma.publicBookingSetting.findUniqueOrThrow({
        where: { id: f.setting.id },
      });
      expect(unchanged.bookingWindowDays).toBe(30);
    } finally {
      await prisma.$executeRawUnsafe(
        `DROP TRIGGER IF EXISTS fail_public_booking_audit_trigger ON "AuditLog"`
      );
      await prisma.$executeRawUnsafe(
        `DROP FUNCTION IF EXISTS fail_public_booking_audit()`
      );
    }
  });
});
