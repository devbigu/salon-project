import { randomUUID } from "node:crypto";
import request from "supertest";

import { app } from "../app.js";
import { prisma } from "../config/prisma.js";
import { createStockMovement } from "../features/stock/stockMovement.service.js";
import { generateAccessToken } from "../utils/jwt.js";

const createFixture = async (lowStockAlert = 5, currentStock = 10) => {
  const [salon, otherSalon] = await Promise.all([
    prisma.salon.create({ data: { name: `Phase 3 ${randomUUID()}` } }),
    prisma.salon.create({ data: { name: `Other ${randomUUID()}` } }),
  ]);
  const [branch, otherBranch] = await Promise.all([
    prisma.branch.create({ data: { name: "Main", salonId: salon.id } }),
    prisma.branch.create({
      data: { name: "Other", salonId: otherSalon.id },
    }),
  ]);
  const vendor = await prisma.vendor.create({
    data: { salonId: salon.id, name: `Vendor ${randomUUID()}` },
  });
  const [admin, staff, otherAdmin] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Admin",
        email: `admin-${randomUUID()}@test.com`,
        passwordHash: "not-used",
        role: "SALON_ADMIN",
        salonId: salon.id,
        branchId: branch.id,
      },
    }),
    prisma.user.create({
      data: {
        name: "Staff",
        email: `staff-${randomUUID()}@test.com`,
        passwordHash: "not-used",
        role: "STAFF",
        salonId: salon.id,
        branchId: branch.id,
      },
    }),
    prisma.user.create({
      data: {
        name: "Other Admin",
        email: `other-${randomUUID()}@test.com`,
        passwordHash: "not-used",
        role: "SALON_ADMIN",
        salonId: otherSalon.id,
        branchId: otherBranch.id,
      },
    }),
  ]);
  const product = await prisma.product.create({
    data: {
      salonId: salon.id,
      branchId: branch.id,
      vendorId: vendor.id,
      name: `Product ${randomUUID()}`,
      costPrice: 12.5,
      currentStock,
      lowStockAlert,
      isServiceConsumable: true,
    },
  });
  const tokenFor = (
    user: typeof admin,
    targetSalonId: string,
    targetBranchId: string
  ) =>
    generateAccessToken({
      userId: user.id,
      role: user.role,
      salonId: targetSalonId,
      branchId: targetBranchId,
    });

  return {
    salon,
    otherSalon,
    branch,
    otherBranch,
    vendor,
    admin,
    staff,
    otherAdmin,
    product,
    adminToken: tokenFor(admin, salon.id, branch.id),
    staffToken: tokenFor(staff, salon.id, branch.id),
    otherToken: tokenFor(otherAdmin, otherSalon.id, otherBranch.id),
  };
};

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

describe("stock alerts and reorder suggestions", () => {
  it("creates one low-stock lifecycle pair, calculates quantity, and resolves the alert on recovery", async () => {
    const fixture = await createFixture(5, 10);

    await prisma.$transaction((tx) =>
      createStockMovement({
        tx,
        salonId: fixture.salon.id,
        branchId: fixture.branch.id,
        productId: fixture.product.id,
        type: "STOCK_OUT",
        quantity: 5,
      })
    );
    const [alert, suggestion] = await Promise.all([
      prisma.stockAlert.findFirstOrThrow({
        where: { productId: fixture.product.id, status: "OPEN" },
      }),
      prisma.reorderSuggestion.findFirstOrThrow({
        where: { productId: fixture.product.id, status: "PENDING" },
      }),
    ]);
    expect(Number(alert.currentStock)).toBe(5);
    expect(Number(alert.threshold)).toBe(5);
    expect(suggestion.vendorId).toBe(fixture.vendor.id);
    expect(Number(suggestion.suggestedQuantity)).toBe(5);

    await prisma.$transaction((tx) =>
      createStockMovement({
        tx,
        salonId: fixture.salon.id,
        branchId: fixture.branch.id,
        productId: fixture.product.id,
        type: "STOCK_OUT",
        quantity: 1,
      })
    );
    expect(
      await prisma.stockAlert.count({
        where: { productId: fixture.product.id, status: "OPEN" },
      })
    ).toBe(1);
    expect(
      await prisma.reorderSuggestion.count({
        where: {
          productId: fixture.product.id,
          status: { in: ["PENDING", "APPROVED"] },
        },
      })
    ).toBe(1);

    await prisma.$transaction((tx) =>
      createStockMovement({
        tx,
        salonId: fixture.salon.id,
        branchId: fixture.branch.id,
        productId: fixture.product.id,
        type: "STOCK_IN",
        quantity: 10,
      })
    );
    const resolved = await prisma.stockAlert.findUniqueOrThrow({
      where: { id: alert.id },
    });
    expect(resolved.status).toBe("RESOLVED");
    expect(resolved.resolvedAt).toBeInstanceOf(Date);
  });

  it("skips products with a zero threshold and tenant-isolates alert routes", async () => {
    const fixture = await createFixture(0, 5);
    await prisma.$transaction((tx) =>
      createStockMovement({
        tx,
        salonId: fixture.salon.id,
        productId: fixture.product.id,
        type: "STOCK_OUT",
        quantity: 1,
      })
    );
    expect(
      await prisma.stockAlert.count({
        where: { productId: fixture.product.id },
      })
    ).toBe(0);

    const alert = await prisma.stockAlert.create({
      data: {
        salonId: fixture.salon.id,
        branchId: fixture.branch.id,
        productId: fixture.product.id,
        currentStock: 4,
        threshold: 5,
      },
    });
    const ownList = await request(app)
      .get("/api/stock-alerts")
      .set(auth(fixture.adminToken));
    expect(ownList.statusCode).toBe(200);
    expect(ownList.body.data.map((row: { id: string }) => row.id)).toContain(
      alert.id
    );

    await request(app)
      .get(`/api/stock-alerts/${alert.id}`)
      .set(auth(fixture.otherToken))
      .expect(404);
    await request(app)
      .patch(`/api/stock-alerts/${alert.id}/resolve`)
      .set(auth(fixture.otherToken))
      .expect(404);
  });

  it("manually resolves idempotently and permits a new alert on a later low-stock movement", async () => {
    const fixture = await createFixture(5, 6);
    await prisma.$transaction((tx) =>
      createStockMovement({
        tx,
        salonId: fixture.salon.id,
        productId: fixture.product.id,
        type: "STOCK_OUT",
        quantity: 1,
      })
    );
    const first = await prisma.stockAlert.findFirstOrThrow({
      where: { productId: fixture.product.id, status: "OPEN" },
    });
    await request(app)
      .patch(`/api/stock-alerts/${first.id}/resolve`)
      .set(auth(fixture.adminToken))
      .expect(200);
    const secondResolve = await request(app)
      .patch(`/api/stock-alerts/${first.id}/resolve`)
      .set(auth(fixture.adminToken));
    expect(secondResolve.statusCode).toBe(200);
    expect(secondResolve.body.message).toMatch(/already resolved/i);

    await prisma.$transaction((tx) =>
      createStockMovement({
        tx,
        salonId: fixture.salon.id,
        productId: fixture.product.id,
        type: "STOCK_OUT",
        quantity: 1,
      })
    );
    expect(
      await prisma.stockAlert.count({
        where: { productId: fixture.product.id },
      })
    ).toBe(2);
  });

  it("approves and converts exactly once through received purchase stock-in", async () => {
    const fixture = await createFixture(5, 10);
    await prisma.$transaction((tx) =>
      createStockMovement({
        tx,
        salonId: fixture.salon.id,
        branchId: fixture.branch.id,
        productId: fixture.product.id,
        type: "STOCK_OUT",
        quantity: 5,
      })
    );
    const suggestion = await prisma.reorderSuggestion.findFirstOrThrow({
      where: { productId: fixture.product.id },
    });

    const approved = await request(app)
      .patch(`/api/reorder-suggestions/${suggestion.id}/approve`)
      .set(auth(fixture.adminToken));
    expect(approved.statusCode).toBe(200);
    expect(approved.body.data.status).toBe("APPROVED");

    const converted = await request(app)
      .post(`/api/reorder-suggestions/${suggestion.id}/convert-to-purchase`)
      .set(auth(fixture.adminToken));
    expect(converted.statusCode).toBe(201);
    const purchaseId = converted.body.data.purchaseId as string;

    const retry = await request(app)
      .post(`/api/reorder-suggestions/${suggestion.id}/convert-to-purchase`)
      .set(auth(fixture.adminToken));
    expect(retry.statusCode).toBe(200);
    expect(retry.body.data.purchaseId).toBe(purchaseId);
    expect(retry.body.data.alreadyConverted).toBe(true);

    const [product, storedSuggestion] = await Promise.all([
      prisma.product.findUniqueOrThrow({ where: { id: fixture.product.id } }),
      prisma.reorderSuggestion.findUniqueOrThrow({
        where: { id: suggestion.id },
      }),
    ]);
    expect(Number(product.currentStock)).toBe(10);
    expect(storedSuggestion.status).toBe("CONVERTED_TO_PURCHASE");
    expect(storedSuggestion.convertedPurchaseId).toBe(purchaseId);
    expect(
      await prisma.productPurchase.count({ where: { id: purchaseId } })
    ).toBe(1);
    expect(
      await prisma.productPurchaseItem.count({ where: { purchaseId } })
    ).toBe(1);
    expect(
      await prisma.productStockMovement.count({
        where: {
          referenceType: "PRODUCT_PURCHASE",
          referenceId: purchaseId,
          type: "STOCK_IN",
        },
      })
    ).toBe(1);
    expect(
      await prisma.auditLog.count({
        where: {
          entityId: suggestion.id,
          action: { in: ["APPROVE", "CONVERT"] },
        },
      })
    ).toBe(2);
  });

  it("rejects forbidden conversion states, cross-salon access, and staff management", async () => {
    const fixture = await createFixture();
    const suggestion = await prisma.reorderSuggestion.create({
      data: {
        salonId: fixture.salon.id,
        branchId: fixture.branch.id,
        productId: fixture.product.id,
        vendorId: fixture.vendor.id,
        suggestedQuantity: 5,
      },
    });

    await request(app)
      .patch(`/api/reorder-suggestions/${suggestion.id}/approve`)
      .set(auth(fixture.staffToken))
      .expect(403);
    await request(app)
      .patch(`/api/reorder-suggestions/${suggestion.id}/reject`)
      .set(auth(fixture.staffToken))
      .expect(403);
    await request(app)
      .post(`/api/reorder-suggestions/${suggestion.id}/convert-to-purchase`)
      .set(auth(fixture.staffToken))
      .expect(403);
    await request(app)
      .post(`/api/reorder-suggestions/${suggestion.id}/convert-to-purchase`)
      .set(auth(fixture.otherToken))
      .expect(404);

    await request(app)
      .patch(`/api/reorder-suggestions/${suggestion.id}/reject`)
      .set(auth(fixture.adminToken))
      .expect(200);
    expect(
      await prisma.auditLog.count({
        where: { entityId: suggestion.id, action: "REJECT" },
      })
    ).toBe(1);
    const rejectedConvert = await request(app)
      .post(`/api/reorder-suggestions/${suggestion.id}/convert-to-purchase`)
      .set(auth(fixture.adminToken));
    expect(rejectedConvert.statusCode).toBe(409);
    expect(rejectedConvert.body.message).toMatch(/rejected/i);
  });
});
