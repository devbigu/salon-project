import request from "supertest";

import { app } from "../app.js";
import { prisma } from "../config/prisma.js";
import { generateAccessToken } from "../utils/jwt.js";

describe("Support ticket API", () => {
  it("rate limits public ticket creation after three requests per IP", async () => {
    const responses = [];
    for (let attempt = 0; attempt < 4; attempt += 1) {
      responses.push(
        await request(app)
          .post("/api/support-tickets/public")
          .set("x-test-rate-limit", "enforce")
          .send({
            reporterEmail: `rate-${attempt}@test.com`,
            title: "Rate limit test",
            description: "Testing public support throttling",
            category: "LOGIN_ISSUE",
          })
      );
    }
    expect(responses.slice(0, 3).every((response) => response.status === 201)).toBe(true);
    expect(responses[3]?.status).toBe(429);
    expect(responses[3]?.body.message).toBe("Too many requests. Please try again later.");
  });
  it("supports public and authenticated ticket workflows with RBAC and tenant isolation", async () => {
    const [salonA, salonB] = await Promise.all([
      prisma.salon.create({ data: { name: "Salon A" } }),
      prisma.salon.create({ data: { name: "Salon B" } }),
    ]);

    const branchA = await prisma.branch.create({
      data: {
        name: "Salon A Main",
        salonId: salonA.id,
      },
    });

    const [superAdmin, salonAdminA, salonAdminB] = await Promise.all([
      prisma.user.create({
        data: {
          name: "Platform Admin",
          email: "support-admin@test.com",
          passwordHash: "not-used",
          role: "SUPER_ADMIN",
        },
      }),
      prisma.user.create({
        data: {
          name: "Salon A Admin",
          email: "admin-a@test.com",
          passwordHash: "not-used",
          role: "SALON_ADMIN",
          salonId: salonA.id,
          branchId: branchA.id,
        },
      }),
      prisma.user.create({
        data: {
          name: "Salon B Admin",
          email: "admin-b@test.com",
          passwordHash: "not-used",
          role: "SALON_ADMIN",
          salonId: salonB.id,
        },
      }),
    ]);

    const superAdminToken = generateAccessToken({
      userId: superAdmin.id,
      role: superAdmin.role,
    });
    const salonAdminAToken = generateAccessToken({
      userId: salonAdminA.id,
      role: salonAdminA.role,
      salonId: salonA.id,
      branchId: branchA.id,
    });
    const salonAdminBToken = generateAccessToken({
      userId: salonAdminB.id,
      role: salonAdminB.role,
      salonId: salonB.id,
    });

    const publicCreate = await request(app)
      .post("/api/support-tickets/public")
      .send({
        reporterName: "Locked Out User",
        reporterEmail: "locked-out@test.com",
        reporterPhone: "9999999999",
        title: "Unable to login",
        description: "The login page rejects valid credentials",
        category: "LOGIN_ISSUE",
        errorMessage: "Invalid credentials",
      });

    expect(publicCreate.statusCode).toBe(201);
    expect(publicCreate.body.data).toMatchObject({
      source: "LOGIN_PAGE",
      reporterId: null,
      reporterEmail: "locked-out@test.com",
      status: "OPEN",
      priority: "MEDIUM",
      category: "LOGIN_ISSUE",
    });
    expect(publicCreate.body.data.ticketCode).toMatch(/^TKT/);

    const missingReporterEmail = await request(app)
      .post("/api/support-tickets/public")
      .send({
        reporterName: "No Email User",
        title: "Unable to login",
        description: "The login page rejects valid credentials",
        category: "LOGIN_ISSUE",
      });

    expect(missingReporterEmail.statusCode).toBe(400);

    const publicTicketCode = publicCreate.body.data.ticketCode as string;

    const publicLookup = await request(app)
      .get(`/api/support-tickets/public/${publicTicketCode}`)
      .query({ email: "locked-out@test.com" });

    expect(publicLookup.statusCode).toBe(200);
    expect(publicLookup.body.data.ticketCode).toBe(publicTicketCode);

    const wrongEmailLookup = await request(app)
      .get(`/api/support-tickets/public/${publicTicketCode}`)
      .query({ email: "wrong@test.com" });

    expect(wrongEmailLookup.statusCode).toBe(404);

    const dashboardCreate = await request(app)
      .post("/api/support-tickets")
      .set("Authorization", `Bearer ${salonAdminAToken}`)
      .send({
        salonId: salonB.id,
        reporterId: salonAdminB.id,
        title: "Cannot add customer",
        description: "Save customer shows internal server error",
        category: "APPOINTMENT_MODULE",
        priority: "HIGH",
        pageUrl: "/customers/create",
        errorMessage: "500 Internal Server Error",
      });

    expect(dashboardCreate.statusCode).toBe(201);
    expect(dashboardCreate.body.data).toMatchObject({
      source: "DASHBOARD",
      reporterId: salonAdminA.id,
      salonId: salonA.id,
      branchId: branchA.id,
      reporterEmail: salonAdminA.email,
      status: "OPEN",
      priority: "HIGH",
    });

    const dashboardTicketId = dashboardCreate.body.data.id as string;

    const myTickets = await request(app)
      .get("/api/support-tickets/my")
      .set("Authorization", `Bearer ${salonAdminAToken}`);

    expect(myTickets.statusCode).toBe(200);
    expect(myTickets.body.data).toHaveLength(1);
    expect(myTickets.body.data[0].id).toBe(dashboardTicketId);

    const filteredTickets = await request(app)
      .get("/api/support-tickets")
      .query({
        status: "OPEN",
        priority: "HIGH",
        category: "APPOINTMENT_MODULE",
      })
      .set("Authorization", `Bearer ${superAdminToken}`);

    expect(filteredTickets.statusCode).toBe(200);
    expect(filteredTickets.body.data).toHaveLength(1);
    expect(filteredTickets.body.data[0].id).toBe(dashboardTicketId);
    expect(filteredTickets.body.pagination).toMatchObject({ page: 1, limit: 25, total: 1, totalPages: 1 });

    const cappedTickets = await request(app)
      .get("/api/support-tickets?limit=500")
      .set("Authorization", `Bearer ${superAdminToken}`);
    expect(cappedTickets.statusCode).toBe(200);
    expect(cappedTickets.body.pagination.limit).toBe(100);
    expect(
      (await request(app).get("/api/support-tickets?page=-1").set("Authorization", `Bearer ${superAdminToken}`)).statusCode
    ).toBe(400);

    const assignTicket = await request(app)
      .patch(`/api/support-tickets/${dashboardTicketId}/assign`)
      .set("Authorization", `Bearer ${superAdminToken}`)
      .send({ assignedToId: superAdmin.id });

    expect(assignTicket.statusCode).toBe(200);
    expect(assignTicket.body.data.assignedToId).toBe(superAdmin.id);

    const inProgress = await request(app)
      .patch(`/api/support-tickets/${dashboardTicketId}/status`)
      .set("Authorization", `Bearer ${superAdminToken}`)
      .send({
        status: "IN_PROGRESS",
        note: "Investigating issue",
      });

    expect(inProgress.statusCode).toBe(200);
    expect(inProgress.body.data.status).toBe("IN_PROGRESS");
    expect(
      inProgress.body.data.statusHistory.some(
        (entry: { newStatus: string; note?: string }) =>
          entry.newStatus === "IN_PROGRESS" &&
          entry.note === "Investigating issue"
      )
    ).toBe(true);

    const resolved = await request(app)
      .patch(`/api/support-tickets/${dashboardTicketId}/status`)
      .set("Authorization", `Bearer ${superAdminToken}`)
      .send({
        status: "RESOLVED",
        note: "Bug fixed",
        resolutionNotes: "Fixed customer create validation issue",
      });

    expect(resolved.statusCode).toBe(200);
    expect(resolved.body.data).toMatchObject({
      status: "RESOLVED",
      resolutionNotes: "Fixed customer create validation issue",
    });

    const closed = await request(app)
      .patch(`/api/support-tickets/${dashboardTicketId}/status`)
      .set("Authorization", `Bearer ${superAdminToken}`)
      .send({
        status: "CLOSED",
        note: "Reporter confirmed the fix",
      });

    expect(closed.statusCode).toBe(200);
    expect(closed.body.data.status).toBe("CLOSED");
    expect(
      closed.body.data.statusHistory.some(
        (entry: { oldStatus: string; newStatus: string; note?: string }) =>
          entry.oldStatus === "RESOLVED" &&
          entry.newStatus === "CLOSED" &&
          entry.note === "Reporter confirmed the fix"
      )
    ).toBe(true);

    const forbiddenStatusUpdate = await request(app)
      .patch(`/api/support-tickets/${dashboardTicketId}/status`)
      .set("Authorization", `Bearer ${salonAdminAToken}`)
      .send({ status: "CLOSED" });

    expect(forbiddenStatusUpdate.statusCode).toBe(403);

    const crossTenantRead = await request(app)
      .get(`/api/support-tickets/${dashboardTicketId}`)
      .set("Authorization", `Bearer ${salonAdminBToken}`);

    expect(crossTenantRead.statusCode).toBe(404);

    const reporterMessage = await request(app)
      .post(`/api/support-tickets/${dashboardTicketId}/messages`)
      .set("Authorization", `Bearer ${salonAdminAToken}`)
      .send({ message: "This is still affecting another customer." });

    expect(reporterMessage.statusCode).toBe(201);

    const forbiddenInternalNote = await request(app)
      .post(`/api/support-tickets/${dashboardTicketId}/messages`)
      .set("Authorization", `Bearer ${salonAdminAToken}`)
      .send({
        message: "Private note",
        isInternalNote: true,
      });

    expect(forbiddenInternalNote.statusCode).toBe(403);

    const internalNote = await request(app)
      .post(`/api/support-tickets/${dashboardTicketId}/messages`)
      .set("Authorization", `Bearer ${superAdminToken}`)
      .send({
        message: "Internal platform note",
        isInternalNote: true,
      });

    expect(internalNote.statusCode).toBe(201);

    const reporterRead = await request(app)
      .get(`/api/support-tickets/${dashboardTicketId}`)
      .set("Authorization", `Bearer ${salonAdminAToken}`);

    expect(reporterRead.statusCode).toBe(200);
    expect(
      reporterRead.body.data.messages.every(
        (message: { isInternalNote: boolean }) => !message.isInternalNote
      )
    ).toBe(true);
  });
});
