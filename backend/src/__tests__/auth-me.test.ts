import request from "supertest";

import { app } from "../app.js";

describe("Protected Auth Routes", () => {
  it("should return current token payload with valid token", async () => {
    const email = `me${Date.now()}@example.com`;

    const registerRes = await request(app).post("/api/auth/register").send({
      name: "Me User",
      email,
      phone_number: `7${Date.now().toString().slice(-9)}`,
      password: "Password@123",
    });

    const token = registerRes.body.data.accessToken;

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.userId).toBe(registerRes.body.data.user.id);
    expect(res.body.user.role).toBe("SUPER_ADMIN");
  });

  it("should reject request without token", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.statusCode).toBe(401);
  });
});
