import { randomUUID } from "node:crypto";
import request from "supertest";

import { app } from "../app.js";
import { prisma } from "../config/prisma.js";
import { createStockMovement } from "../features/stock/stockMovement.service.js";
import { generateAccessToken } from "../utils/jwt.js";

const createFixture = async (currentStock = 0) => {
  const [salon, otherSalon] = await Promise.all([
    prisma.salon.create({ data: { name: `Stock Salon ${randomUUID()}` } }),
    prisma.salon.create({ data: { name: `Other Stock Salon ${randomUUID()}` } }),
  ]);
  const branch = await prisma.branch.create({
    data: { name: "Stock Branch", salonId: salon.id },
  });
  const admin = await prisma.user.create({
    data: {
      name: "Stock Admin",
      email: `stock-${randomUUID()}@test.com`,
      passwordHash: "not-used",
      role: "SALON_ADMIN",
      salonId: salon.id,
      branchId: branch.id,
    },
  });
  const product = await prisma.product.create({
    data: {
      salonId: salon.id,
      branchId: branch.id,
      name: `Stock Product ${randomUUID()}`,
      currentStock,
      isRetailProduct: true,
    },
  });
  const token = generateAccessToken({
    userId: admin.id,
    role: admin.role,
    salonId: salon.id,
    branchId: branch.id,
  });

  return { salon, otherSalon, branch, admin, product, token };
};

describe("central stock movement service", () => {
  it("does not apply a duplicate automatic reference twice", async () => {
    const fixture = await createFixture();
    const referenceId = randomUUID();

    const first = await prisma.$transaction((tx) =>
      createStockMovement({
        tx,
        salonId: fixture.salon.id,
        branchId: fixture.branch.id,
        productId: fixture.product.id,
        type: "STOCK_IN",
        quantity: 5,
        referenceType: "PRODUCT_PURCHASE",
        referenceId,
        createdById: fixture.admin.id,
      })
    );
    const retry = await prisma.$transaction((tx) =>
      createStockMovement({
        tx,
        salonId: fixture.salon.id,
        branchId: fixture.branch.id,
        productId: fixture.product.id,
        type: "STOCK_IN",
        quantity: 5,
        referenceType: "PRODUCT_PURCHASE",
        referenceId,
        createdById: fixture.admin.id,
      })
    );

    expect(first.duplicate).toBe(false);
    expect(retry.duplicate).toBe(true);
    expect(Number(first.movement.stockBefore)).toBe(0);
    expect(Number(first.movement.stockAfter)).toBe(5);
    expect(
      Number(
        (
          await prisma.product.findUniqueOrThrow({
            where: { id: fixture.product.id },
          })
        ).currentStock
      )
    ).toBe(5);
    expect(
      await prisma.productStockMovement.count({
        where: {
          productId: fixture.product.id,
          type: "STOCK_IN",
          referenceType: "PRODUCT_PURCHASE",
          referenceId,
        },
      })
    ).toBe(1);
  });

  it("supports manual stock-in, stock-out, and damaged movements with exact balances", async () => {
    const fixture = await createFixture(5);
    const auth = { Authorization: `Bearer ${fixture.token}` };

    const stockIn = await request(app)
      .post("/api/stock-movements/manual")
      .set(auth)
      .send({ productId: fixture.product.id, type: "STOCK_IN", quantity: 2 });
    expect(stockIn.statusCode).toBe(201);
    expect(Number(stockIn.body.data.stockBefore)).toBe(5);
    expect(Number(stockIn.body.data.stockAfter)).toBe(7);

    const stockOut = await request(app)
      .post("/api/stock-movements/manual")
      .set(auth)
      .send({ productId: fixture.product.id, type: "STOCK_OUT", quantity: 3 });
    expect(stockOut.statusCode).toBe(201);
    expect(Number(stockOut.body.data.stockBefore)).toBe(7);
    expect(Number(stockOut.body.data.stockAfter)).toBe(4);

    const damaged = await request(app)
      .post("/api/stock-movements/manual")
      .set(auth)
      .send({ productId: fixture.product.id, type: "DAMAGED", quantity: 1 });
    expect(damaged.statusCode).toBe(201);
    expect(Number(damaged.body.data.stockBefore)).toBe(4);
    expect(Number(damaged.body.data.stockAfter)).toBe(3);

    const insufficient = await request(app)
      .post("/api/stock-movements/manual")
      .set(auth)
      .send({ productId: fixture.product.id, type: "STOCK_OUT", quantity: 4 });
    expect(insufficient.statusCode).toBe(400);
    expect(insufficient.body.message).toMatch(/insufficient stock/i);
    expect(
      Number(
        (
          await prisma.product.findUniqueOrThrow({
            where: { id: fixture.product.id },
          })
        ).currentStock
      )
    ).toBe(3);
  });

  it("rejects a product from another salon", async () => {
    const fixture = await createFixture(5);

    await expect(
      prisma.$transaction((tx) =>
        createStockMovement({
          tx,
          salonId: fixture.otherSalon.id,
          productId: fixture.product.id,
          type: "STOCK_OUT",
          quantity: 1,
        })
      )
    ).rejects.toMatchObject({
      message: "Product not found",
      status: 404,
    });

    const product = await prisma.product.findUniqueOrThrow({
      where: { id: fixture.product.id },
    });
    expect(Number(product.currentStock)).toBe(5);
  });
});
