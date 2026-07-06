import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import request from "supertest";
import { app } from "../app.js";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { detectToolName } from "../features/ai-assistant/ai-intent-router.js";
import { redactAiData } from "../features/ai-assistant/ai-redaction.service.js";
import { getAiTools } from "../features/ai-assistant/ai-tool-registry.js";

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

const tokenFor = (user: {
  id: string;
  role: string;
  salonId: string | null;
  branchId: string | null;
}) =>
  jwt.sign(
    {
      userId: user.id,
      role: user.role,
      ...(user.salonId ? { salonId: user.salonId } : {}),
      ...(user.branchId ? { branchId: user.branchId } : {}),
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );

const fixture = async () => {
  const marker = randomUUID();
  const [salon, otherSalon] = await Promise.all([
    prisma.salon.create({
      data: { name: `AI Salon ${marker}`, timezone: "UTC" },
    }),
    prisma.salon.create({
      data: { name: `Other AI Salon ${marker}`, timezone: "UTC" },
    }),
  ]);
  const [branch, otherBranch, foreignBranch] = await Promise.all([
    prisma.branch.create({
      data: { salonId: salon.id, name: `AI Main ${marker}` },
    }),
    prisma.branch.create({
      data: { salonId: salon.id, name: `AI Other ${marker}` },
    }),
    prisma.branch.create({
      data: { salonId: otherSalon.id, name: `AI Foreign ${marker}` },
    }),
  ]);
  const [admin, manager, receptionist, staff] = await Promise.all([
    prisma.user.create({
      data: {
        name: "AI Admin",
        email: `ai-admin-${marker}@test.com`,
        passwordHash: "test",
        role: "SALON_ADMIN",
        salonId: salon.id,
      },
    }),
    prisma.user.create({
      data: {
        name: "AI Manager",
        email: `ai-manager-${marker}@test.com`,
        passwordHash: "test",
        role: "BRANCH_MANAGER",
        salonId: salon.id,
        branchId: branch.id,
      },
    }),
    prisma.user.create({
      data: {
        name: "AI Receptionist",
        email: `ai-reception-${marker}@test.com`,
        passwordHash: "test",
        role: "RECEPTIONIST",
        salonId: salon.id,
        branchId: branch.id,
      },
    }),
    prisma.user.create({
      data: {
        name: "AI Staff",
        email: `ai-staff-${marker}@test.com`,
        passwordHash: "test",
        role: "STAFF",
        salonId: salon.id,
        branchId: branch.id,
      },
    }),
  ]);
  const [customer, otherCustomer, foreignCustomer] = await Promise.all([
    prisma.customer.create({
      data: {
        salonId: salon.id,
        branchId: branch.id,
        customerCode: `AI-1-${marker}`,
        name: "AI Customer",
      },
    }),
    prisma.customer.create({
      data: {
        salonId: salon.id,
        branchId: otherBranch.id,
        customerCode: `AI-2-${marker}`,
        name: "Other Branch Customer",
      },
    }),
    prisma.customer.create({
      data: {
        salonId: otherSalon.id,
        branchId: foreignBranch.id,
        customerCode: `AI-3-${marker}`,
        name: "Foreign Customer",
      },
    }),
  ]);
  const date = new Date().toISOString().slice(0, 10);
  const startTime = new Date(`${date}T12:00:00.000Z`);
  const endTime = new Date(`${date}T12:30:00.000Z`);
  await prisma.appointment.createMany({
    data: [
      {
        salonId: salon.id,
        branchId: branch.id,
        customerId: customer.id,
        appointmentCode: `AI-A1-${marker}`,
        startTime,
        endTime,
      },
      {
        salonId: salon.id,
        branchId: otherBranch.id,
        customerId: otherCustomer.id,
        appointmentCode: `AI-A2-${marker}`,
        startTime,
        endTime,
      },
      {
        salonId: otherSalon.id,
        branchId: foreignBranch.id,
        customerId: foreignCustomer.id,
        appointmentCode: `AI-A3-${marker}`,
        startTime,
        endTime,
      },
    ],
  });

  return {
    adminToken: tokenFor(admin),
    managerToken: tokenFor(manager),
    receptionistToken: tokenFor(receptionist),
    staffToken: tokenFor(staff),
  };
};

describe("AI assistant foundation", () => {
  it("registers all six read-only tools and routes supported intents", () => {
    expect(getAiTools().map((tool) => tool.name)).toEqual([
      "getTodayAppointments",
      "getRevenueSummary",
      "getLowStockProducts",
      "getOutstandingCustomers",
      "getPackageExpirySummary",
      "getMembershipExpirySummary",
    ]);
    expect(detectToolName("How many appointments are there today?")).toBe(
      "getTodayAppointments"
    );
    expect(detectToolName("Show low stock")).toBe("getLowStockProducts");
    expect(detectToolName("Please cancel all appointments")).toBe("BLOCKED");
    expect(detectToolName("Tell me a joke")).toBeNull();
  });

  it("recursively redacts sensitive result fields", () => {
    expect(
      redactAiData({
        name: "Visible",
        profile: {
          email: "private@example.com",
          token: "secret",
          nested: [{ phone: "9999999999", total: 100 }],
        },
      })
    ).toEqual({
      name: "Visible",
      profile: {
        email: "[REDACTED]",
        token: "[REDACTED]",
        nested: [{ phone: "[REDACTED]", total: 100 }],
      },
    });
  });

  it("requires authentication and a valid message", async () => {
    const f = await fixture();
    await request(app)
      .post("/api/ai-assistant/chat")
      .send({ message: "appointments today" })
      .expect(401);
    await request(app)
      .post("/api/ai-assistant/chat")
      .set(auth(f.adminToken))
      .send({ message: "  " })
      .expect(400);
  });

  it("keeps appointment answers within salon and branch scope", async () => {
    const f = await fixture();
    const salonAnswer = await request(app)
      .post("/api/ai-assistant/chat")
      .set(auth(f.adminToken))
      .send({ message: "How many appointments do we have today?" })
      .expect(200);
    expect(salonAnswer.body.data.answer).toContain("2 appointments");
    expect(salonAnswer.body.data.usedTools).toEqual([
      { toolName: "getTodayAppointments", status: "SUCCESS" },
    ]);

    const branchAnswer = await request(app)
      .post("/api/ai-assistant/chat")
      .set(auth(f.managerToken))
      .send({ message: "appointments today" })
      .expect(200);
    expect(branchAnswer.body.data.answer).toContain("1 appointment today");
  });

  it("blocks write-like prompts and role-restricted data tools", async () => {
    const f = await fixture();
    const unsafe = await request(app)
      .post("/api/ai-assistant/chat")
      .set(auth(f.receptionistToken))
      .send({ message: "Cancel all appointments" })
      .expect(200);
    expect(unsafe.body.data.usedTools).toEqual([
      { toolName: "BLOCKED", status: "BLOCKED" },
    ]);

    const restricted = await request(app)
      .post("/api/ai-assistant/chat")
      .set(auth(f.receptionistToken))
      .send({ message: "Show today's revenue" })
      .expect(200);
    expect(restricted.body.data.usedTools).toEqual([
      { toolName: "getRevenueSummary", status: "BLOCKED" },
    ]);

    const staff = await request(app)
      .post("/api/ai-assistant/chat")
      .set(auth(f.staffToken))
      .send({ message: "appointments today" })
      .expect(200);
    expect(staff.body.data.usedTools[0].status).toBe("BLOCKED");
  });
});
