import request from "supertest";
import { app } from "../app.js";

describe("universal UUID route validation", () => {
  it("returns 400 for malformed IDs across major modules and accepts valid UUIDs", async () => {
    const stamp = Date.now();
    const registration = await request(app).post("/api/auth/register").send({
      name: "UUID Super Admin",
      email: `uuid-${stamp}@example.com`,
      phone_number: `3${String(stamp).slice(-9)}`,
      password: "Password@123",
    });
    const auth = { Authorization: `Bearer ${registration.body.data.accessToken}` };

    for (const path of [
      "/api/customers/not-a-uuid",
      "/api/appointments/not-a-uuid",
      "/api/products/not-a-uuid",
      "/api/salary-slips/not-a-uuid",
      "/api/support-tickets/not-a-uuid",
      "/api/payments/not-a-uuid",
    ]) {
      const response = await request(app).get(path).set(auth);
      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({ success: false, message: "Invalid ID format" });
    }

    const salon = await request(app)
      .post("/api/salons")
      .set(auth)
      .send({ name: `UUID Salon ${stamp}` });
    const branch = await request(app)
      .post("/api/branches")
      .set(auth)
      .send({ name: `UUID Branch ${stamp}`, salonId: salon.body.data.id });
    const valid = await request(app)
      .get(`/api/branches/${branch.body.data.id}`)
      .set(auth);
    expect(valid.statusCode).toBe(200);
    expect(valid.body.data.id).toBe(branch.body.data.id);
  });
});
