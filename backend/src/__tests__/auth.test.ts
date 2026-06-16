import request from "supertest";

import { app } from "../app.js";

const makePhoneNumber = () => {
  return `9${Date.now().toString().slice(-9)}`;
};

describe("Auth API", () => {
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
});
