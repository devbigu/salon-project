import request from "supertest";

import { app } from "../app.js";
import { prisma } from "../config/prisma.js";

const makePhoneNumber = () => {
  return `9${Date.now().toString().slice(-9)}`;
};

describe("Auth API", () => {
  it("rate limits login attempts after five requests per IP", async () => {
    const responses = [];
    for (let attempt = 0; attempt < 6; attempt += 1) {
      responses.push(
        await request(app)
          .post("/api/auth/login")
          .set("x-test-rate-limit", "enforce")
          .send({ email: "missing@example.com", password: "Password@123" })
      );
    }
    expect(responses.slice(0, 5).every((response) => response.status === 401)).toBe(true);
    expect(responses[5]?.status).toBe(429);
    expect(responses[5]?.body).toEqual({
      success: false,
      message: "Too many requests. Please try again later.",
    });
  });
  it("should register a new user", async () => {
    const email = `test${Date.now()}@example.com`;

    const res = await request(app).post("/api/auth/register").send({
      name: "Test Admin",
      email,
      phone_number: makePhoneNumber(),
      password: "Password@123",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(email);
    expect(res.body.data.user.role).toBe("SUPER_ADMIN");
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeUndefined();
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("should login a registered user", async () => {
    const email = `login${Date.now()}@example.com`;
    const password = "Password@123";

    await request(app).post("/api/auth/register").send({
      name: "Login User",
      email,
      phone_number: makePhoneNumber(),
      password,
    });

    const res = await request(app).post("/api/auth/login").send({
      email,
      password,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeUndefined();
    expect(res.body.data.user.email).toBe(email);
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("should clear the refresh cookie without requiring an access token", async () => {
    const res = await request(app).post("/api/auth/logout");

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.headers["set-cookie"]?.[0]).toContain("refreshToken=;");
  });

  it("creates, validates, and revokes a hashed refresh session", async () => {
    const agent = request.agent(app);
    const registration = await agent.post("/api/auth/register").send({
      name: "Session User",
      email: `session-${Date.now()}@example.com`,
      phone_number: makePhoneNumber(),
      password: "Password@123",
    });
    expect(registration.statusCode).toBe(201);

    const session = await prisma.userSession.findFirstOrThrow({
      where: { userId: registration.body.data.user.id },
    });
    expect(session.refreshTokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(session.revokedAt).toBeNull();
    expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());

    expect((await agent.post("/api/auth/refresh")).statusCode).toBe(200);
    expect((await agent.post("/api/auth/logout")).statusCode).toBe(200);
    expect(
      (await prisma.userSession.findUniqueOrThrow({ where: { id: session.id } })).revokedAt
    ).not.toBeNull();
    expect((await agent.post("/api/auth/refresh")).statusCode).toBe(401);
  });

  it("rejects refresh for a disabled user", async () => {
    const agent = request.agent(app);
    const registration = await agent.post("/api/auth/register").send({
      name: "Disabled Session User",
      email: `disabled-session-${Date.now()}@example.com`,
      phone_number: makePhoneNumber(),
      password: "Password@123",
    });
    await prisma.user.update({
      where: { id: registration.body.data.user.id },
      data: { status: "DISABLED" },
    });
    const refresh = await agent.post("/api/auth/refresh");
    expect(refresh.statusCode).toBe(403);
    expect(refresh.body.message).toBe("Account is disabled");
  });
});
