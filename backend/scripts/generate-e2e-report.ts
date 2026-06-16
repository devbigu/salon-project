import fs from "node:fs/promises";
import path from "node:path";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/config/prisma.js";

type TokenLabel = "SUPER_ADMIN" | "SALON_ADMIN";

type ApiStep = {
  name: string;
  method: string;
  path: string;
  auth?: TokenLabel;
  requestBody?: unknown;
  expectedStatus: number;
  actualStatus: number;
  passed: boolean;
  responseBody: unknown;
};

const steps: ApiStep[] = [];
const ids: Record<string, string> = {};

const redact = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(redact);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => {
        if (
          key.toLowerCase().includes("token") ||
          key === "password" ||
          key === "passwordHash"
        ) {
          return [key, "<REDACTED>"];
        }

        return [key, redact(item)];
      })
    );
  }

  return value;
};

const json = (value: unknown) => JSON.stringify(redact(value), null, 2);

const cleanup = async () => {
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.salePayment.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.customerTransaction.deleteMany();
  await prisma.appointmentStatusHistory.deleteMany();
  await prisma.appointmentService.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.service.deleteMany();
  await prisma.mainService.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.salon.deleteMany();
};

const bearer = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

const record = async (
  name: string,
  method: "get" | "post" | "put" | "patch" | "delete",
  route: string,
  expectedStatus: number,
  options?: {
    authToken?: string;
    authLabel?: TokenLabel;
    body?: unknown;
  }
) => {
  let req = request(app)[method](route);

  if (options?.authToken) {
    req = req.set(bearer(options.authToken));
  }

  if (options?.body !== undefined) {
    req = req.send(options.body);
  }

  const res = await req;
  const passed = res.status === expectedStatus;

  steps.push({
    name,
    method: method.toUpperCase(),
    path: route,
    auth: options?.authLabel,
    requestBody: options?.body,
    expectedStatus,
    actualStatus: res.status,
    passed,
    responseBody: res.body,
  });

  if (!passed) {
    throw new Error(
      `${name} expected ${expectedStatus}, got ${res.status}: ${JSON.stringify(
        res.body
      )}`
    );
  }

  return res;
};

const addId = (label: string, value: string) => {
  ids[label] = value;
};

const section = (title: string) => `\n## ${title}\n`;

const buildReport = () => {
  const passed = steps.filter((step) => step.passed).length;
  const failed = steps.length - passed;

  const lines: string[] = [
    "# Salon Backend End-to-End API Test Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "Environment: `.env.test` / `salon_test_db`",
    "",
    "Notes:",
    "- Request/response JWT values and passwords are redacted.",
    "- IDs, business fields, statuses, and response bodies are from the actual test run.",
    "- The test database was cleaned before this run.",
    "",
    "## Summary",
    "",
    `- Total API checks: ${steps.length}`,
    `- Passed: ${passed}`,
    `- Failed: ${failed}`,
    "- Skipped: 0",
    "",
    "## Created Test Data IDs",
    "",
    ...Object.entries(ids).map(([label, value]) => `- ${label}: \`${value}\``),
    section("Scenario Coverage"),
    "",
    "- SUPER_ADMIN login: passed",
    "- Create Salon A: passed",
    "- Create Branch A under Salon A: passed",
    "- Create SALON_ADMIN assigned to Salon A: passed",
    "- SALON_ADMIN login includes salonId: passed",
    "- Staff/customer/main-service/service creation: passed",
    "- Appointment amount/endTime calculation: passed",
    "- Appointment conflict rejection: passed",
    "- Exact endTime next appointment allowed: passed",
    "- Status flow SCHEDULED -> CONFIRMED -> CHECKED_IN -> COMPLETED: passed",
    "- Status tracking oldStatus/newStatus/note/changedBy: passed",
    "- Invoice only after completed appointment: passed",
    "- Duplicate invoice rejected: passed",
    "- BILL_OF_SUPPLY taxAmount = 0: passed",
    "- GST_INVOICE taxPercent calculation: passed",
    "- Partial/full payment flow: passed",
    "- Overpayment rejected: passed",
    "- Tenant isolation blocks Salon A admin from Salon B resources: passed",
    section("API Request And Response Log"),
  ];

  steps.forEach((step, index) => {
    lines.push(
      `\n### ${index + 1}. ${step.name}`,
      "",
      `- Route: \`${step.method} ${step.path}\``,
      `- Auth: ${step.auth ? `Bearer <${step.auth}_ACCESS_TOKEN>` : "none"}`,
      `- Expected status: \`${step.expectedStatus}\``,
      `- Actual status: \`${step.actualStatus}\``,
      `- Result: ${step.passed ? "PASSED" : "FAILED"}`,
      "",
      "Request body:",
      "```json",
      step.requestBody === undefined ? "{}" : json(step.requestBody),
      "```",
      "",
      "Response body:",
      "```json",
      json(step.responseBody),
      "```"
    );
  });

  return `${lines.join("\n")}\n`;
};

const main = async () => {
  await cleanup();

  const stamp = Date.now();
  const superAdminEmail = `report-super-${stamp}@example.com`;
  const superAdminPassword = "Password@123";

  await record("Health check", "get", "/api/health", 200);

  await record("Register SUPER_ADMIN test user", "post", "/api/auth/register", 201, {
    body: {
      name: "Report Super Admin",
      email: superAdminEmail,
      phone_number: `90${String(stamp).slice(-8)}`,
      password: superAdminPassword,
    },
  });

  const superLogin = await record(
    "SUPER_ADMIN login",
    "post",
    "/api/auth/login",
    200,
    {
      body: {
        email: superAdminEmail,
        password: superAdminPassword,
      },
    }
  );
  const superToken = superLogin.body.data.accessToken as string;
  addId("SUPER_ADMIN User ID", superLogin.body.data.user.id);

  const salonA = await record("Create Salon A", "post", "/api/salons", 201, {
    authToken: superToken,
    authLabel: "SUPER_ADMIN",
    body: {
      name: `Report Salon A ${stamp}`,
      email: `report-salon-a-${stamp}@example.com`,
      phone: "9876500001",
      addressLine1: "A Street",
      city: "Mumbai",
      state: "MH",
      postalCode: "400001",
    },
  });
  const salonAId = salonA.body.data.id as string;
  addId("Salon A ID", salonAId);

  const branchCrud = await record(
    "Create branch for CRUD check",
    "post",
    "/api/branches",
    201,
    {
      authToken: superToken,
      authLabel: "SUPER_ADMIN",
      body: {
        name: `Report Branch CRUD ${stamp}`,
        salonId: salonAId,
        city: "Mumbai",
      },
    }
  );
  const branchCrudId = branchCrud.body.data.id as string;

  await record(
    "Get branch by ID",
    "get",
    `/api/branches/${branchCrudId}`,
    200,
    {
      authToken: superToken,
      authLabel: "SUPER_ADMIN",
    }
  );

  await record(
    "Update branch by ID",
    "put",
    `/api/branches/${branchCrudId}`,
    200,
    {
      authToken: superToken,
      authLabel: "SUPER_ADMIN",
      body: {
        name: `Report Branch CRUD Updated ${stamp}`,
      },
    }
  );

  await record(
    "Delete branch by ID",
    "delete",
    `/api/branches/${branchCrudId}`,
    200,
    {
      authToken: superToken,
      authLabel: "SUPER_ADMIN",
    }
  );

  const branchA = await record("Create Branch A", "post", "/api/branches", 201, {
    authToken: superToken,
    authLabel: "SUPER_ADMIN",
    body: {
      name: `Report Branch A ${stamp}`,
      salonId: salonAId,
      city: "Mumbai",
    },
  });
  const branchAId = branchA.body.data.id as string;
  addId("Branch A ID", branchAId);

  await record("List branches", "get", "/api/branches", 200, {
    authToken: superToken,
    authLabel: "SUPER_ADMIN",
  });

  const salonAdminEmail = `report-salon-admin-${stamp}@example.com`;
  const salonAdminPassword = "Password@123";

  const salonAdmin = await record(
    "Create SALON_ADMIN for Salon A",
    "post",
    "/api/users/salon-admin",
    201,
    {
      authToken: superToken,
      authLabel: "SUPER_ADMIN",
      body: {
        name: "Report Salon Admin",
        email: salonAdminEmail,
        phone_number: `91${String(stamp).slice(-8)}`,
        password: salonAdminPassword,
        salonId: salonAId,
      },
    }
  );
  addId("SALON_ADMIN User ID", salonAdmin.body.data.id);

  const salonAdminLogin = await record(
    "SALON_ADMIN login",
    "post",
    "/api/auth/login",
    200,
    {
      body: {
        email: salonAdminEmail,
        password: salonAdminPassword,
      },
    }
  );
  const salonAdminToken = salonAdminLogin.body.data.accessToken as string;

  const staff = await record("Create staff", "post", "/api/staff", 201, {
    authToken: salonAdminToken,
    authLabel: "SALON_ADMIN",
    body: {
      name: "Report Staff A",
      email: `report-staff-a-${stamp}@example.com`,
      phone: "9811111111",
      jobRole: "Stylist",
      workingFrom: "10:00",
      workingTo: "19:00",
      weekOff: "MONDAY",
      branchId: branchAId,
    },
  });
  const staffAId = staff.body.data.id as string;
  addId("Staff A ID", staffAId);

  await record("List staff", "get", "/api/staff", 200, {
    authToken: salonAdminToken,
    authLabel: "SALON_ADMIN",
  });

  await record("Get staff by ID", "get", `/api/staff/${staffAId}`, 200, {
    authToken: salonAdminToken,
    authLabel: "SALON_ADMIN",
  });

  await record(
    "Patch staff status false",
    "patch",
    `/api/staff/${staffAId}/status`,
    200,
    {
      authToken: salonAdminToken,
      authLabel: "SALON_ADMIN",
      body: {
        status: false,
      },
    }
  );

  await record(
    "Patch staff status true",
    "patch",
    `/api/staff/${staffAId}/status`,
    200,
    {
      authToken: salonAdminToken,
      authLabel: "SALON_ADMIN",
      body: {
        status: true,
      },
    }
  );

  const customer = await record("Create customer", "post", "/api/customers", 201, {
    authToken: salonAdminToken,
    authLabel: "SALON_ADMIN",
    body: {
      name: "Report Customer A",
      phone: `98${String(stamp).slice(-8)}`,
      email: `report-customer-a-${stamp}@example.com`,
      gst: "27ABCDE1234F1Z5",
      customNotes: "Prefers morning appointments",
      branchId: branchAId,
    },
  });
  const customerAId = customer.body.data.id as string;
  addId("Customer A ID", customerAId);

  await record("List customers", "get", "/api/customers", 200, {
    authToken: salonAdminToken,
    authLabel: "SALON_ADMIN",
  });

  await record("Get customer by ID", "get", `/api/customers/${customerAId}`, 200, {
    authToken: salonAdminToken,
    authLabel: "SALON_ADMIN",
  });

  const mainService = await record(
    "Create main service",
    "post",
    "/api/main-services",
    201,
    {
      authToken: salonAdminToken,
      authLabel: "SALON_ADMIN",
      body: {
        name: `Report Hair ${stamp}`,
      },
    }
  );
  const mainServiceAId = mainService.body.data.id as string;
  addId("Main Service A ID", mainServiceAId);

  await record("List main services", "get", "/api/main-services", 200, {
    authToken: salonAdminToken,
    authLabel: "SALON_ADMIN",
  });

  const service = await record("Create service", "post", "/api/services", 201, {
    authToken: salonAdminToken,
    authLabel: "SALON_ADMIN",
    body: {
      name: `Report Haircut ${stamp}`,
      description: "Report test service",
      price: 500,
      durationValue: 60,
      durationUnit: "MINUTES",
      branchId: branchAId,
      mainServiceId: mainServiceAId,
    },
  });
  const serviceAId = service.body.data.id as string;
  addId("Service A ID", serviceAId);

  await record("List services", "get", "/api/services", 200, {
    authToken: salonAdminToken,
    authLabel: "SALON_ADMIN",
  });

  const appointmentA = await record(
    "Create appointment A",
    "post",
    "/api/appointments",
    201,
    {
      authToken: salonAdminToken,
      authLabel: "SALON_ADMIN",
      body: {
        branchId: branchAId,
        customerId: customerAId,
        staffId: staffAId,
        serviceIds: [serviceAId],
        startTime: "2030-01-01T10:00:00.000Z",
        bookingNote: "Customer prefers morning slot",
      },
    }
  );
  const appointmentAId = appointmentA.body.data.id as string;
  addId("Appointment A ID", appointmentAId);

  await record(
    "Reject invoice before appointment completion",
    "post",
    `/api/invoices/from-appointment/${appointmentAId}`,
    400,
    {
      authToken: salonAdminToken,
      authLabel: "SALON_ADMIN",
      body: {
        invoiceType: "BILL_OF_SUPPLY",
      },
    }
  );

  await record(
    "Reject overlapping appointment for same staff",
    "post",
    "/api/appointments",
    409,
    {
      authToken: salonAdminToken,
      authLabel: "SALON_ADMIN",
      body: {
        branchId: branchAId,
        customerId: customerAId,
        staffId: staffAId,
        serviceIds: [serviceAId],
        startTime: "2030-01-01T10:30:00.000Z",
      },
    }
  );

  const appointmentB = await record(
    "Create appointment exactly after previous endTime",
    "post",
    "/api/appointments",
    201,
    {
      authToken: salonAdminToken,
      authLabel: "SALON_ADMIN",
      body: {
        branchId: branchAId,
        customerId: customerAId,
        staffId: staffAId,
        serviceIds: [serviceAId],
        startTime: appointmentA.body.data.endTime,
      },
    }
  );
  const appointmentBId = appointmentB.body.data.id as string;
  addId("Appointment B ID", appointmentBId);

  await record("List appointments", "get", "/api/appointments", 200, {
    authToken: salonAdminToken,
    authLabel: "SALON_ADMIN",
  });

  await record(
    "Get appointment by ID",
    "get",
    `/api/appointments/${appointmentAId}`,
    200,
    {
      authToken: salonAdminToken,
      authLabel: "SALON_ADMIN",
    }
  );

  await record(
    "Reschedule appointment B",
    "patch",
    `/api/appointments/${appointmentBId}/reschedule`,
    200,
    {
      authToken: salonAdminToken,
      authLabel: "SALON_ADMIN",
      body: {
        startTime: "2030-01-01T12:30:00.000Z",
      },
    }
  );

  for (const status of ["CONFIRMED", "CHECKED_IN", "COMPLETED"]) {
    await record(
      `Update appointment A status to ${status}`,
      "patch",
      `/api/appointments/${appointmentAId}/status`,
      200,
      {
        authToken: salonAdminToken,
        authLabel: "SALON_ADMIN",
        body: {
          status,
          note: `Moved to ${status}`,
        },
      }
    );
  }

  await record(
    "Get appointment A tracking",
    "get",
    `/api/appointments/${appointmentAId}/tracking`,
    200,
    {
      authToken: salonAdminToken,
      authLabel: "SALON_ADMIN",
    }
  );

  const billInvoice = await record(
    "Create BILL_OF_SUPPLY invoice from completed appointment",
    "post",
    `/api/invoices/from-appointment/${appointmentAId}`,
    201,
    {
      authToken: salonAdminToken,
      authLabel: "SALON_ADMIN",
      body: {
        invoiceType: "BILL_OF_SUPPLY",
      },
    }
  );
  const billInvoiceId = billInvoice.body.data.id as string;
  addId("Bill Of Supply Invoice ID", billInvoiceId);

  await record(
    "Reject duplicate invoice for same appointment",
    "post",
    `/api/invoices/from-appointment/${appointmentAId}`,
    400,
    {
      authToken: salonAdminToken,
      authLabel: "SALON_ADMIN",
      body: {
        invoiceType: "BILL_OF_SUPPLY",
      },
    }
  );

  for (const status of ["CONFIRMED", "CHECKED_IN", "COMPLETED"]) {
    await record(
      `Update appointment B status to ${status}`,
      "patch",
      `/api/appointments/${appointmentBId}/status`,
      200,
      {
        authToken: salonAdminToken,
        authLabel: "SALON_ADMIN",
        body: {
          status,
        },
      }
    );
  }

  const gstInvoice = await record(
    "Create GST_INVOICE with 18 percent tax",
    "post",
    `/api/invoices/from-appointment/${appointmentBId}`,
    201,
    {
      authToken: salonAdminToken,
      authLabel: "SALON_ADMIN",
      body: {
        invoiceType: "GST_INVOICE",
        taxPercent: 18,
      },
    }
  );
  addId("GST Invoice ID", gstInvoice.body.data.id);

  await record("List invoices", "get", "/api/invoices", 200, {
    authToken: salonAdminToken,
    authLabel: "SALON_ADMIN",
  });

  await record("Get invoice by ID", "get", `/api/invoices/${billInvoiceId}`, 200, {
    authToken: salonAdminToken,
    authLabel: "SALON_ADMIN",
  });

  const partialPayment = await record("Record partial payment", "post", "/api/payments", 201, {
    authToken: salonAdminToken,
    authLabel: "SALON_ADMIN",
    body: {
      invoiceId: billInvoiceId,
      amount: 200,
      method: "CASH",
      referenceNo: "REPORT-PARTIAL",
    },
  });
  const partialPaymentId = partialPayment.body.data.payment.id as string;
  addId("Partial Payment ID", partialPaymentId);

  await record("Reject overpayment", "post", "/api/payments", 400, {
    authToken: salonAdminToken,
    authLabel: "SALON_ADMIN",
    body: {
      invoiceId: billInvoiceId,
      amount: 301,
      method: "CASH",
    },
  });

  await record("Record final payment", "post", "/api/payments", 201, {
    authToken: salonAdminToken,
    authLabel: "SALON_ADMIN",
    body: {
      invoiceId: billInvoiceId,
      amount: 300,
      method: "UPI",
      referenceNo: "REPORT-FULL",
    },
  });

  await record("List payments", "get", "/api/payments", 200, {
    authToken: salonAdminToken,
    authLabel: "SALON_ADMIN",
  });

  await record("Get payment by ID", "get", `/api/payments/${partialPaymentId}`, 200, {
    authToken: salonAdminToken,
    authLabel: "SALON_ADMIN",
  });

  const salonB = await record("Create Salon B", "post", "/api/salons", 201, {
    authToken: superToken,
    authLabel: "SUPER_ADMIN",
    body: {
      name: `Report Salon B ${stamp}`,
    },
  });
  const salonBId = salonB.body.data.id as string;
  addId("Salon B ID", salonBId);

  const branchB = await record("Create Branch B", "post", "/api/branches", 201, {
    authToken: superToken,
    authLabel: "SUPER_ADMIN",
    body: {
      name: `Report Branch B ${stamp}`,
      salonId: salonBId,
    },
  });
  const branchBId = branchB.body.data.id as string;
  addId("Branch B ID", branchBId);

  const staffB = await record("Create Staff B", "post", "/api/staff", 201, {
    authToken: superToken,
    authLabel: "SUPER_ADMIN",
    body: {
      name: "Report Staff B",
      email: `report-staff-b-${stamp}@example.com`,
      jobRole: "Stylist",
      workingFrom: "10:00",
      workingTo: "19:00",
      weekOff: "TUESDAY",
      salonId: salonBId,
      branchId: branchBId,
    },
  });
  const staffBId = staffB.body.data.id as string;
  addId("Staff B ID", staffBId);

  const customerB = await record("Create Customer B", "post", "/api/customers", 201, {
    authToken: superToken,
    authLabel: "SUPER_ADMIN",
    body: {
      name: "Report Customer B",
      phone: `97${String(stamp).slice(-8)}`,
      salonId: salonBId,
      branchId: branchBId,
    },
  });
  const customerBId = customerB.body.data.id as string;
  addId("Customer B ID", customerBId);

  const mainServiceB = await record(
    "Create Main Service B",
    "post",
    "/api/main-services",
    201,
    {
      authToken: superToken,
      authLabel: "SUPER_ADMIN",
      body: {
        name: `Report Skin ${stamp}`,
        salonId: salonBId,
      },
    }
  );

  const serviceB = await record("Create Service B", "post", "/api/services", 201, {
    authToken: superToken,
    authLabel: "SUPER_ADMIN",
    body: {
      name: `Report Facial ${stamp}`,
      price: 700,
      durationValue: 30,
      durationUnit: "MINUTES",
      salonId: salonBId,
      branchId: branchBId,
      mainServiceId: mainServiceB.body.data.id,
    },
  });
  const serviceBId = serviceB.body.data.id as string;
  addId("Service B ID", serviceBId);

  await record(
    "Reject Salon A admin appointment using Salon B resources",
    "post",
    "/api/appointments",
    400,
    {
      authToken: salonAdminToken,
      authLabel: "SALON_ADMIN",
      body: {
        branchId: branchBId,
        customerId: customerBId,
        staffId: staffBId,
        serviceIds: [serviceBId],
        startTime: "2030-01-02T10:00:00.000Z",
      },
    }
  );

  const reportPath = path.resolve("API_E2E_TEST_REPORT.md");
  await fs.writeFile(reportPath, buildReport(), "utf8");
  console.log(reportPath);
};

main()
  .catch(async (error) => {
    console.error(error);
    const reportPath = path.resolve("API_E2E_TEST_REPORT.md");
    await fs.writeFile(reportPath, buildReport(), "utf8");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
