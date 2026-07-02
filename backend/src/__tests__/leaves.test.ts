import request from "supertest";

import { app } from "../app.js";
import { prisma } from "../config/prisma.js";
import { generateAccessToken } from "../utils/jwt.js";

describe("staff leaves", () => {
  const createFixture = async () => {
    const salon = await prisma.salon.create({ data: { name: "Leave Salon" } });
    const otherSalon = await prisma.salon.create({ data: { name: "Other Leave Salon" } });
    const branch = await prisma.branch.create({
      data: { name: "Leave Branch", salonId: salon.id },
    });
    const admin = await prisma.user.create({
      data: {
        name: "Leave Admin",
        email: "leave-admin@example.com",
        passwordHash: "test-hash",
        role: "SALON_ADMIN",
        salonId: salon.id,
      },
    });
    const otherAdmin = await prisma.user.create({
      data: {
        name: "Other Leave Admin",
        email: "other-leave-admin@example.com",
        passwordHash: "test-hash",
        role: "SALON_ADMIN",
        salonId: otherSalon.id,
      },
    });
    const staffUser = await prisma.user.create({
      data: {
        name: "Leave Staff User",
        email: "leave-staff-user@example.com",
        passwordHash: "test-hash",
        role: "STAFF",
        salonId: salon.id,
        branchId: branch.id,
      },
    });
    const staff = await prisma.staff.create({
      data: {
        name: "Leave Staff",
        email: "leave-staff@example.com",
        jobRole: "Stylist",
        workingFrom: "10:00",
        workingTo: "19:00",
        weekOff: "MONDAY",
        salonId: salon.id,
        branchId: branch.id,
        userId: staffUser.id,
      },
    });

    return {
      adminToken: generateAccessToken({
        userId: admin.id,
        role: admin.role,
        salonId: salon.id,
      }),
      otherAdminToken: generateAccessToken({
        userId: otherAdmin.id,
        role: otherAdmin.role,
        salonId: otherSalon.id,
      }),
      staffToken: generateAccessToken({
        userId: staffUser.id,
        role: staffUser.role,
        salonId: salon.id,
        branchId: branch.id,
      }),
      staff,
    };
  };

  const requestLeave = (token: string) =>
    request(app)
      .post("/api/leaves")
      .set("Authorization", `Bearer ${token}`)
      .send({
        leaveType: "PAID_LEAVE",
        startDate: "2026-07-10",
        endDate: "2026-07-12",
        reason: "Family event",
      });

  it("allows STAFF to request leave for themselves", async () => {
    const fixture = await createFixture();
    const response = await requestLeave(fixture.staffToken);

    expect(response.status).toBe(201);
    expect(response.body.data.staffId).toBe(fixture.staff.id);
    expect(response.body.data.status).toBe("PENDING");
    expect(response.body.data.totalDays).toBe(3);
  });

  it("allows an admin to approve pending leave", async () => {
    const fixture = await createFixture();
    const created = await requestLeave(fixture.staffToken);
    const response = await request(app)
      .patch(`/api/leaves/${created.body.data.id}/approve`)
      .set("Authorization", `Bearer ${fixture.adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("APPROVED");
    expect(response.body.data.approvedBy).toBeTruthy();
    expect(response.body.data.approvedAt).toBeTruthy();
  });

  it("rejects overlapping pending or approved leave", async () => {
    const fixture = await createFixture();
    expect((await requestLeave(fixture.staffToken)).status).toBe(201);

    const response = await request(app)
      .post("/api/leaves")
      .set("Authorization", `Bearer ${fixture.staffToken}`)
      .send({
        leaveType: "SICK_LEAVE",
        startDate: "2026-07-12",
        endDate: "2026-07-13",
      });

    expect(response.status).toBe(409);
    expect(response.body.message).toContain("overlaps");
  });

  it("prevents STAFF from approving their own leave", async () => {
    const fixture = await createFixture();
    const created = await requestLeave(fixture.staffToken);
    const response = await request(app)
      .patch(`/api/leaves/${created.body.data.id}/approve`)
      .set("Authorization", `Bearer ${fixture.staffToken}`);

    expect(response.status).toBe(403);
  });

  it("rejects cross-salon access", async () => {
    const fixture = await createFixture();
    const created = await requestLeave(fixture.staffToken);
    const response = await request(app)
      .get(`/api/leaves/${created.body.data.id}`)
      .set("Authorization", `Bearer ${fixture.otherAdminToken}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("You do not have access to this leave");
  });
});
