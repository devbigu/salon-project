import request from "supertest";

import { app } from "../app.js";
import { prisma } from "../config/prisma.js";
import { generateAccessToken } from "../utils/jwt.js";

describe("staff attendance", () => {
  const createFixture = async () => {
    const salon = await prisma.salon.create({ data: { name: "Attendance Salon" } });
    const otherSalon = await prisma.salon.create({ data: { name: "Other Salon" } });
    const branch = await prisma.branch.create({
      data: { name: "Main Branch", salonId: salon.id },
    });
    const otherBranch = await prisma.branch.create({
      data: { name: "Other Branch", salonId: otherSalon.id },
    });
    const admin = await prisma.user.create({
      data: {
        name: "Salon Admin",
        email: "attendance-admin@example.com",
        passwordHash: "test-hash",
        role: "SALON_ADMIN",
        salonId: salon.id,
      },
    });
    const otherAdmin = await prisma.user.create({
      data: {
        name: "Other Admin",
        email: "other-attendance-admin@example.com",
        passwordHash: "test-hash",
        role: "SALON_ADMIN",
        salonId: otherSalon.id,
      },
    });
    const staffUser = await prisma.user.create({
      data: {
        name: "Linked Staff User",
        email: "linked-staff@example.com",
        passwordHash: "test-hash",
        role: "STAFF",
        salonId: salon.id,
        branchId: branch.id,
      },
    });
    const staff = await prisma.staff.create({
      data: {
        name: "Linked Staff",
        email: "linked-staff-profile@example.com",
        jobRole: "Stylist",
        workingFrom: "10:00",
        workingTo: "19:00",
        weekOff: "MONDAY",
        salonId: salon.id,
        branchId: branch.id,
        userId: staffUser.id,
      },
    });
    const colleague = await prisma.staff.create({
      data: {
        name: "Colleague",
        email: "colleague@example.com",
        jobRole: "Stylist",
        workingFrom: "10:00",
        workingTo: "19:00",
        weekOff: "TUESDAY",
        salonId: salon.id,
        branchId: branch.id,
      },
    });
    const otherStaff = await prisma.staff.create({
      data: {
        name: "Other Salon Staff",
        email: "other-salon-staff@example.com",
        jobRole: "Stylist",
        workingFrom: "10:00",
        workingTo: "19:00",
        weekOff: "WEDNESDAY",
        salonId: otherSalon.id,
        branchId: otherBranch.id,
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
      colleague,
      otherStaff,
    };
  };

  it("allows a SALON_ADMIN to mark a check-in", async () => {
    const fixture = await createFixture();
    const response = await request(app)
      .post("/api/attendance/check-in")
      .set("Authorization", `Bearer ${fixture.adminToken}`)
      .send({
        staffId: fixture.staff.id,
        date: "2026-07-02",
        checkInTime: "2026-07-02T10:05:00.000Z",
      });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("PRESENT");
    expect(response.body.data.lateMinutes).toBe(0);
  });

  it("stores lateMinutes for a late check-in", async () => {
    const fixture = await createFixture();
    const response = await request(app)
      .post("/api/attendance/check-in")
      .set("Authorization", `Bearer ${fixture.adminToken}`)
      .send({
        staffId: fixture.staff.id,
        date: "2026-07-02",
        checkInTime: "2026-07-02T10:25:00.000Z",
      });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("LATE");
    expect(response.body.data.lateMinutes).toBe(15);

    const stored = await prisma.staffAttendance.findFirst({
      where: { staffId: fixture.staff.id },
    });
    expect(stored?.lateMinutes).toBe(15);
  });

  it("prevents STAFF from viewing another staff member's attendance", async () => {
    const fixture = await createFixture();
    const response = await request(app)
      .get(`/api/attendance/staff/${fixture.colleague.id}`)
      .set("Authorization", `Bearer ${fixture.staffToken}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Staff can only access their own attendance");
  });

  it("rejects cross-salon attendance access", async () => {
    const fixture = await createFixture();
    const response = await request(app)
      .post("/api/attendance/check-in")
      .set("Authorization", `Bearer ${fixture.otherAdminToken}`)
      .send({
        staffId: fixture.staff.id,
        date: "2026-07-02",
        checkInTime: "2026-07-02T10:05:00.000Z",
      });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Staff does not belong to your salon");
  });
});
