import request from "supertest";

import { app } from "../app.js";
import { prisma } from "../config/prisma.js";
import { generateAccessToken } from "../utils/jwt.js";

describe("Week 3 inventory, vendor, expense, and reports flow", () => {
  it("keeps stock, vendor balances, reports, RBAC, and tenants consistent", async () => {
    const [salonA, salonB] = await Promise.all([
      prisma.salon.create({ data: { name: "Inventory Salon A" } }),
      prisma.salon.create({ data: { name: "Inventory Salon B" } }),
    ]);
    const branchA = await prisma.branch.create({
      data: { name: "Inventory Main", salonId: salonA.id },
    });
    const [adminA, adminB, staffA] = await Promise.all([
      prisma.user.create({
        data: {
          name: "Inventory Admin A",
          email: "inventory-admin-a@test.com",
          passwordHash: "not-used",
          role: "SALON_ADMIN",
          salonId: salonA.id,
          branchId: branchA.id,
        },
      }),
      prisma.user.create({
        data: {
          name: "Inventory Admin B",
          email: "inventory-admin-b@test.com",
          passwordHash: "not-used",
          role: "SALON_ADMIN",
          salonId: salonB.id,
        },
      }),
      prisma.user.create({
        data: {
          name: "Inventory Staff A",
          email: "inventory-staff-a@test.com",
          passwordHash: "not-used",
          role: "STAFF",
          salonId: salonA.id,
          branchId: branchA.id,
        },
      }),
    ]);
    const adminAToken = generateAccessToken({
      userId: adminA.id,
      role: adminA.role,
      salonId: salonA.id,
      branchId: branchA.id,
    });
    const adminBToken = generateAccessToken({
      userId: adminB.id,
      role: adminB.role,
      salonId: salonB.id,
    });
    const staffAToken = generateAccessToken({
      userId: staffA.id,
      role: staffA.role,
      salonId: salonA.id,
      branchId: branchA.id,
    });
    const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

    const brandResponse = await request(app)
      .post("/api/product-brands")
      .set(auth(adminAToken))
      .send({ name: "Week 3 Brand", salonId: salonB.id });
    expect(brandResponse.statusCode).toBe(201);
    expect(brandResponse.body.data.salonId).toBe(salonA.id);

    const vendorResponse = await request(app)
      .post("/api/vendors")
      .set(auth(adminAToken))
      .send({ name: "Week 3 Vendor", phone: "9999999999" });
    expect(vendorResponse.statusCode).toBe(201);
    const vendorId = vendorResponse.body.data.id as string;

    const productResponse = await request(app)
      .post("/api/products")
      .set(auth(adminAToken))
      .send({
        name: "Week 3 Shampoo",
        brandId: brandResponse.body.data.id,
        vendorId,
        branchId: branchA.id,
        costPrice: 100,
        sellingPrice: 150,
        lowStockAlert: 5,
        isRetailProduct: true,
        isServiceConsumable: true,
      });
    expect(productResponse.statusCode).toBe(201);
    expect(Number(productResponse.body.data.currentStock)).toBe(0);
    const productId = productResponse.body.data.id as string;

    const purchaseResponse = await request(app)
      .post("/api/product-purchases")
      .set(auth(adminAToken))
      .send({
        branchId: branchA.id,
        vendorId,
        invoiceNo: "SUP-1001",
        items: [{ productId, quantity: 10, unitCost: 100 }],
      });
    expect(purchaseResponse.statusCode).toBe(201);
    expect(purchaseResponse.body.data).toMatchObject({
      vendorId,
      paymentStatus: "UNPAID",
    });
    expect(Number(purchaseResponse.body.data.totalAmount)).toBe(1000);
    expect(Number(purchaseResponse.body.data.paidAmount)).toBe(0);
    expect(Number(purchaseResponse.body.data.balanceAmount)).toBe(1000);
    const purchaseId = purchaseResponse.body.data.id as string;

    let product = await prisma.product.findUniqueOrThrow({
      where: { id: productId },
    });
    expect(Number(product.currentStock)).toBe(10);
    expect(
      await prisma.productStockMovement.count({
        where: {
          productId,
          type: "STOCK_IN",
          referenceId: purchaseId,
        },
      })
    ).toBe(1);

    const vendorPaymentResponse = await request(app)
      .post("/api/vendor-payments")
      .set(auth(adminAToken))
      .send({
        vendorId,
        purchaseId,
        amount: 400,
        paymentMethod: "UPI",
      });
    expect(vendorPaymentResponse.statusCode).toBe(201);
    const paidPurchase = await prisma.productPurchase.findUniqueOrThrow({
      where: { id: purchaseId },
    });
    expect(Number(paidPurchase.paidAmount)).toBe(400);
    expect(Number(paidPurchase.balanceAmount)).toBe(600);
    expect(paidPurchase.paymentStatus).toBe("PARTIALLY_PAID");

    const retailResponse = await request(app)
      .post("/api/retail-sales")
      .set(auth(adminAToken))
      .send({
        branchId: branchA.id,
        paymentMethod: "CASH",
        items: [{ productId, quantity: 2, unitPrice: 150 }],
      });
    expect(retailResponse.statusCode).toBe(201);
    product = await prisma.product.findUniqueOrThrow({
      where: { id: productId },
    });
    expect(Number(product.currentStock)).toBe(8);
    expect(
      await prisma.productStockMovement.count({
        where: { productId, type: "RETAIL_SALE" },
      })
    ).toBe(1);

    const damagedResponse = await request(app)
      .post("/api/stock-movements/manual")
      .set(auth(adminAToken))
      .send({ productId, type: "DAMAGED", quantity: 4, reason: "Leak" });
    expect(damagedResponse.statusCode).toBe(201);
    expect(Number(damagedResponse.body.data.stockAfter)).toBe(4);

    const lowStockResponse = await request(app)
      .get("/api/products/low-stock")
      .set(auth(adminAToken));
    expect(lowStockResponse.statusCode).toBe(200);
    expect(lowStockResponse.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: productId, requiredQuantity: 1 }),
      ])
    );

    const insufficientResponse = await request(app)
      .post("/api/retail-sales")
      .set(auth(adminAToken))
      .send({
        branchId: branchA.id,
        paymentMethod: "CASH",
        items: [{ productId, quantity: 999, unitPrice: 150 }],
      });
    expect(insufficientResponse.statusCode).toBe(400);

    const categoryResponse = await request(app)
      .post("/api/expense-categories")
      .set(auth(adminAToken))
      .send({ name: "Rent" });
    expect(categoryResponse.statusCode).toBe(201);

    const expenseResponse = await request(app)
      .post("/api/expenses")
      .set(auth(adminAToken))
      .send({
        title: "June rent",
        categoryDefinitionId: categoryResponse.body.data.id,
        amount: 500,
        branchId: branchA.id,
        paymentMethod: "BANK_TRANSFER",
      });
    expect(expenseResponse.statusCode).toBe(201);

    const [inventoryReport, expenseReport, profitReport] = await Promise.all([
      request(app).get("/api/reports/inventory").set(auth(adminAToken)),
      request(app).get("/api/reports/expenses").set(auth(adminAToken)),
      request(app).get("/api/reports/profit-summary").set(auth(adminAToken)),
    ]);
    expect(inventoryReport.statusCode).toBe(200);
    expect(inventoryReport.body.data).toMatchObject({
      totalProducts: 1,
      totalStockQuantity: 4,
      totalStockCostValue: 400,
      totalRetailValue: 600,
      lowStockCount: 1,
    });
    expect(expenseReport.statusCode).toBe(200);
    expect(expenseReport.body.data.totalExpenses).toBe(500);
    expect(expenseReport.body.data.expensesByCategory).toEqual(
      expect.arrayContaining([{ category: "Rent", total: 500 }])
    );
    expect(profitReport.statusCode).toBe(200);
    expect(profitReport.body.data).toMatchObject({
      serviceRevenue: 0,
      saleRevenue: 0,
      retailSalesTotal: 300,
      productPurchaseCost: 1000,
      expensesTotal: 500,
      estimatedProfit: -1200,
    });

    const crossTenant = await request(app)
      .get(`/api/products/${productId}`)
      .set(auth(adminBToken));
    expect(crossTenant.statusCode).toBe(404);

    const staffProductWrite = await request(app)
      .post("/api/products")
      .set(auth(staffAToken))
      .send({ name: "Forbidden product" });
    expect(staffProductWrite.statusCode).toBe(403);
    const staffExpenseWrite = await request(app)
      .post("/api/expenses")
      .set(auth(staffAToken))
      .send({ title: "Forbidden expense", category: "MISC", amount: 1 });
    expect(staffExpenseWrite.statusCode).toBe(403);
  });
});
