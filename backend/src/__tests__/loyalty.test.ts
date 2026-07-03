import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import request from "supertest";

import { app } from "../app.js";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";

type Actor = {
  id: string;
  role: string;
  salonId?: string | null;
  branchId?: string | null;
};

const auth = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

const tokenFor = (actor: Actor) =>
  jwt.sign(
    {
      userId: actor.id,
      role: actor.role,
      ...(actor.salonId ? { salonId: actor.salonId } : {}),
      ...(actor.branchId ? { branchId: actor.branchId } : {}),
    },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: "15m",
    }
  );

describe("Loyalty rules and manual loyalty adjustments", () => {
  let salonAId: string;
  let salonBId: string;
  let customerAId: string;
  let customerBId: string;
  let superAdminToken: string;
  let salonAdminToken: string;
  let receptionistToken: string;
  let staffToken: string;

  beforeEach(async () => {
    const stamp = randomUUID();
    const salonA = await prisma.salon.create({
      data: {
        name: `Loyalty Salon A ${stamp}`,
      },
    });
    const salonB = await prisma.salon.create({
      data: {
        name: `Loyalty Salon B ${stamp}`,
      },
    });
    const branchA = await prisma.branch.create({
      data: {
        name: `Loyalty Branch A ${stamp}`,
        salonId: salonA.id,
      },
    });
    const branchB = await prisma.branch.create({
      data: {
        name: `Loyalty Branch B ${stamp}`,
        salonId: salonB.id,
      },
    });

    salonAId = salonA.id;
    salonBId = salonB.id;

    const [superAdmin, salonAdmin, receptionist, staff] = await Promise.all([
      prisma.user.create({
        data: {
          name: "Loyalty Super Admin",
          email: `loyalty-super-${stamp}@example.com`,
          passwordHash: "test-only",
          role: "SUPER_ADMIN",
        },
      }),
      prisma.user.create({
        data: {
          name: "Loyalty Salon Admin",
          email: `loyalty-admin-${stamp}@example.com`,
          passwordHash: "test-only",
          role: "SALON_ADMIN",
          salonId: salonA.id,
        },
      }),
      prisma.user.create({
        data: {
          name: "Loyalty Receptionist",
          email: `loyalty-reception-${stamp}@example.com`,
          passwordHash: "test-only",
          role: "RECEPTIONIST",
          salonId: salonA.id,
          branchId: branchA.id,
        },
      }),
      prisma.user.create({
        data: {
          name: "Loyalty Staff",
          email: `loyalty-staff-${stamp}@example.com`,
          passwordHash: "test-only",
          role: "STAFF",
          salonId: salonA.id,
          branchId: branchA.id,
        },
      }),
    ]);

    const [customerA, customerB] = await Promise.all([
      prisma.customer.create({
        data: {
          customerCode: `LOY-A-${stamp}`,
          name: "Loyalty Customer A",
          phone: `LOY-A-${stamp}`,
          salonId: salonA.id,
          branchId: branchA.id,
        },
      }),
      prisma.customer.create({
        data: {
          customerCode: `LOY-B-${stamp}`,
          name: "Loyalty Customer B",
          phone: `LOY-B-${stamp}`,
          salonId: salonB.id,
          branchId: branchB.id,
        },
      }),
    ]);

    customerAId = customerA.id;
    customerBId = customerB.id;
    superAdminToken = tokenFor(superAdmin);
    salonAdminToken = tokenFor(salonAdmin);
    receptionistToken = tokenFor(receptionist);
    staffToken = tokenFor(staff);
  });

  it("creates and fetches an active loyalty rule with default meaning", async () => {
    const create = await request(app)
      .post("/api/loyalty-rules")
      .set(auth(salonAdminToken))
      .send({});

    expect(create.status).toBe(201);
    expect(create.body.data).toMatchObject({
      salonId: salonAId,
      minRedeemPoints: 0,
      maxRedeemPoints: null,
      status: true,
    });
    expect(Number(create.body.data.earnAmountStep)).toBe(100);
    expect(Number(create.body.data.earnPointsPerAmount)).toBe(1);
    expect(Number(create.body.data.redeemValuePerPoint)).toBe(1);
    expect(await prisma.auditLog.count({ where: { module: "LOYALTY", action: "CREATE", entityId: create.body.data.id } })).toBe(1);

    const active = await request(app)
      .get("/api/loyalty-rules/active")
      .set(auth(salonAdminToken));

    expect(active.status).toBe(200);
    expect(active.body.data.id).toBe(create.body.data.id);
  });

  it("deactivates the old rule when a second active rule is created", async () => {
    const first = await request(app)
      .post("/api/loyalty-rules")
      .set(auth(salonAdminToken))
      .send({
        earnAmountStep: 100,
        earnPointsPerAmount: 1,
      });
    const second = await request(app)
      .post("/api/loyalty-rules")
      .set(auth(salonAdminToken))
      .send({
        earnAmountStep: 200,
        earnPointsPerAmount: 3,
      });

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);

    const rules = await prisma.loyaltyRule.findMany({
      where: {
        salonId: salonAId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    expect(rules).toHaveLength(2);
    expect(rules.find((rule) => rule.id === first.body.data.id)?.status).toBe(
      false
    );
    expect(rules.find((rule) => rule.id === second.body.data.id)?.status).toBe(
      true
    );
  });

  it("rejects maxRedeemPoints below minRedeemPoints", async () => {
    const response = await request(app)
      .post("/api/loyalty-rules")
      .set(auth(salonAdminToken))
      .send({
        minRedeemPoints: 100,
        maxRedeemPoints: 99,
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("increases the customer balance with a positive manual adjustment", async () => {
    const response = await request(app)
      .post(`/api/loyalty/customers/${customerAId}/adjust`)
      .set(auth(salonAdminToken))
      .send({
        points: 25,
        note: "Service recovery bonus",
      });

    expect(response.status).toBe(200);
    expect(response.body.data.customer.loyaltyPoints).toBe(25);
    expect(response.body.data.transaction).toMatchObject({
      type: "ADJUSTED",
      points: 25,
      balanceBefore: 0,
      balanceAfter: 25,
      referenceType: "MANUAL_ADJUSTMENT",
      note: "Service recovery bonus",
    });
    expect(await prisma.auditLog.count({ where: { module: "LOYALTY", action: "UPDATE", entityId: response.body.data.transaction.id } })).toBe(1);
  });

  it("decreases the customer balance with a negative manual adjustment", async () => {
    await prisma.customer.update({
      where: {
        id: customerAId,
      },
      data: {
        loyaltyPoints: 50,
      },
    });

    const response = await request(app)
      .post(`/api/loyalty/customers/${customerAId}/adjust`)
      .set(auth(salonAdminToken))
      .send({
        points: -20,
      });

    expect(response.status).toBe(200);
    expect(response.body.data.customer.loyaltyPoints).toBe(30);
    expect(response.body.data.transaction).toMatchObject({
      points: -20,
      balanceBefore: 50,
      balanceAfter: 30,
    });
  });

  it("rejects an adjustment that would take the balance below zero", async () => {
    await prisma.customer.update({
      where: {
        id: customerAId,
      },
      data: {
        loyaltyPoints: 10,
      },
    });

    const response = await request(app)
      .post(`/api/loyalty/customers/${customerAId}/adjust`)
      .set(auth(salonAdminToken))
      .send({
        points: -11,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Loyalty point balance cannot go below 0"
    );
    expect(
      await prisma.customer.findUnique({
        where: {
          id: customerAId,
        },
        select: {
          loyaltyPoints: true,
        },
      })
    ).toEqual({
      loyaltyPoints: 10,
    });
    expect(
      await prisma.loyaltyTransaction.count({
        where: {
          customerId: customerAId,
        },
      })
    ).toBe(0);
  });

  it("stores complete balance history and allows receptionist viewing", async () => {
    await request(app)
      .post(`/api/loyalty/customers/${customerAId}/adjust`)
      .set(auth(salonAdminToken))
      .send({
        points: 10,
      })
      .expect(200);
    await request(app)
      .post(`/api/loyalty/customers/${customerAId}/adjust`)
      .set(auth(salonAdminToken))
      .send({
        points: -3,
      })
      .expect(200);

    const history = await request(app)
      .get(`/api/loyalty/customers/${customerAId}/transactions`)
      .set(auth(receptionistToken));

    expect(history.status).toBe(200);
    expect(history.body.data.customer.loyaltyPoints).toBe(7);
    expect(
      history.body.data.transactions.map(
        (transaction: {
          points: number;
          balanceBefore: number;
          balanceAfter: number;
        }) => ({
          points: transaction.points,
          balanceBefore: transaction.balanceBefore,
          balanceAfter: transaction.balanceAfter,
        })
      )
    ).toEqual([
      {
        points: -3,
        balanceBefore: 10,
        balanceAfter: 7,
      },
      {
        points: 10,
        balanceBefore: 0,
        balanceAfter: 10,
      },
    ]);
  });

  it("blocks cross-salon history and adjustment access", async () => {
    const history = await request(app)
      .get(`/api/loyalty/customers/${customerBId}/transactions`)
      .set(auth(salonAdminToken));
    const adjustment = await request(app)
      .post(`/api/loyalty/customers/${customerBId}/adjust`)
      .set(auth(salonAdminToken))
      .send({
        points: 10,
      });

    expect(history.status).toBe(404);
    expect(adjustment.status).toBe(404);
  });

  it("prevents staff from manually adjusting points", async () => {
    const response = await request(app)
      .post(`/api/loyalty/customers/${customerAId}/adjust`)
      .set(auth(staffToken))
      .send({
        points: 10,
      });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  it("allows a super admin to adjust a customer in any salon", async () => {
    const response = await request(app)
      .post(`/api/loyalty/customers/${customerBId}/adjust`)
      .set(auth(superAdminToken))
      .send({
        points: 5,
      });

    expect(response.status).toBe(200);
    expect(response.body.data.customer).toMatchObject({
      id: customerBId,
      salonId: salonBId,
      loyaltyPoints: 5,
    });
  });

  it("paginates and server-filters the global loyalty transaction list", async () => {
    await prisma.loyaltyTransaction.createMany({
      data: [
        {
          salonId: salonAId,
          customerId: customerAId,
          type: "EARNED",
          points: 10,
          balanceBefore: 0,
          balanceAfter: 10,
          referenceType: "INVOICE",
          referenceId: "INV-SEARCH-ONE",
          note: "Birthday reward",
          createdAt: new Date("2030-01-10T10:00:00.000Z"),
        },
        {
          salonId: salonAId,
          customerId: customerAId,
          type: "REDEEMED",
          points: -2,
          balanceBefore: 10,
          balanceAfter: 8,
          referenceType: "INVOICE",
          referenceId: "INV-SEARCH-TWO",
          createdAt: new Date("2030-02-10T10:00:00.000Z"),
        },
        {
          salonId: salonAId,
          customerId: customerAId,
          type: "ADJUSTED",
          points: 5,
          balanceBefore: 8,
          balanceAfter: 13,
          referenceType: "MANUAL_ADJUSTMENT",
          note: "Service recovery",
          createdAt: new Date("2030-03-10T10:00:00.000Z"),
        },
      ],
    });

    const page = await request(app)
      .get("/api/loyalty-transactions?page=2&limit=1")
      .set(auth(salonAdminToken));
    expect(page.status).toBe(200);
    expect(page.body.data).toHaveLength(1);
    expect(page.body.pagination).toEqual({
      page: 2,
      limit: 1,
      total: 3,
      totalPages: 3,
    });

    const byCustomerAndType = await request(app)
      .get(
        `/api/loyalty-transactions?customerId=${customerAId}&type=EARNED`
      )
      .set(auth(salonAdminToken));
    expect(byCustomerAndType.status).toBe(200);
    expect(byCustomerAndType.body.data).toHaveLength(1);
    expect(byCustomerAndType.body.data[0]).toMatchObject({
      customerId: customerAId,
      type: "EARNED",
    });

    const byDate = await request(app)
      .get(
        "/api/loyalty-transactions?startDate=2030-02-01&endDate=2030-02-28"
      )
      .set(auth(salonAdminToken));
    expect(byDate.status).toBe(200);
    expect(byDate.body.data).toHaveLength(1);
    expect(byDate.body.data[0].type).toBe("REDEEMED");

    for (const search of [
      "Loyalty Customer A",
      "LOY-A-",
      "Birthday reward",
      "INV-SEARCH-ONE",
    ]) {
      const result = await request(app)
        .get(`/api/loyalty-transactions?search=${encodeURIComponent(search)}`)
        .set(auth(salonAdminToken));
      expect(result.status).toBe(200);
      expect(result.body.data.length).toBeGreaterThan(0);
    }
  });

  it("isolates global loyalty history by salon and blocks staff", async () => {
    await prisma.loyaltyTransaction.createMany({
      data: [
        {
          salonId: salonAId,
          customerId: customerAId,
          type: "ADJUSTED",
          points: 1,
          balanceBefore: 0,
          balanceAfter: 1,
        },
        {
          salonId: salonBId,
          customerId: customerBId,
          type: "ADJUSTED",
          points: 1,
          balanceBefore: 0,
          balanceAfter: 1,
        },
      ],
    });

    const admin = await request(app)
      .get("/api/loyalty-transactions")
      .set(auth(salonAdminToken));
    expect(admin.status).toBe(200);
    expect(admin.body.data).toHaveLength(1);
    expect(admin.body.data[0].salonId).toBe(salonAId);

    const staff = await request(app)
      .get("/api/loyalty-transactions")
      .set(auth(staffToken));
    expect(staff.status).toBe(403);
  });
});
