import request from "supertest";
import { app } from "../app.js";

const auth = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

const expectSuccess = (res: request.Response, status: number) => {
  if (res.status !== status) {
    throw new Error(
      `Expected ${status}, received ${res.status}: ${JSON.stringify(res.body)}`
    );
  }
  expect(res.body.success).toBe(true);
};

const expectFailure = (res: request.Response, status: number) => {
  if (res.status !== status) {
    throw new Error(
      `Expected ${status}, received ${res.status}: ${JSON.stringify(res.body)}`
    );
  }
  expect(res.body.success).toBe(false);
};

describe("Salon SaaS backend E2E flow", () => {
  it("runs the main salon flow, billing flow, and tenant isolation checks", async () => {
    const stamp = Date.now();

    const health = await request(app).get("/api/health");
    expect(health.status).toBe(200);

    const superAdminEmail = `super-${stamp}@example.com`;
    const superAdminPassword = "Password@123";

    const registerSuperAdmin = await request(app).post("/api/auth/register").send({
      name: "E2E Super Admin",
      email: superAdminEmail,
      phone_number: `9000${String(stamp).slice(-6)}`,
      password: superAdminPassword,
    });
    expectSuccess(registerSuperAdmin, 201);

    const superAdminLogin = await request(app).post("/api/auth/login").send({
      email: superAdminEmail,
      password: superAdminPassword,
    });
    expectSuccess(superAdminLogin, 200);
    const superAdminToken = superAdminLogin.body.data.accessToken as string;

    const salonARes = await request(app)
      .post("/api/salons")
      .set(auth(superAdminToken))
      .send({
        name: `E2E Salon A ${stamp}`,
        email: `salon-a-${stamp}@example.com`,
        phone: "9876500001",
        addressLine1: "A Street",
        city: "Mumbai",
        state: "MH",
        postalCode: "400001",
      });
    expectSuccess(salonARes, 201);
    const salonAId = salonARes.body.data.id as string;

    const branchCrudRes = await request(app)
      .post("/api/branches")
      .set(auth(superAdminToken))
      .send({
        name: `E2E Branch CRUD ${stamp}`,
        salonId: salonAId,
        city: "Mumbai",
      });
    expectSuccess(branchCrudRes, 201);
    const branchCrudId = branchCrudRes.body.data.id as string;

    const branchById = await request(app)
      .get(`/api/branches/${branchCrudId}`)
      .set(auth(superAdminToken));
    expectSuccess(branchById, 200);

    const branchUpdate = await request(app)
      .put(`/api/branches/${branchCrudId}`)
      .set(auth(superAdminToken))
      .send({ name: `E2E Branch CRUD Updated ${stamp}` });
    expectSuccess(branchUpdate, 200);
    expect(branchUpdate.body.data.name).toBe(`E2E Branch CRUD Updated ${stamp}`);

    const branchDelete = await request(app)
      .delete(`/api/branches/${branchCrudId}`)
      .set(auth(superAdminToken));
    expectSuccess(branchDelete, 200);

    const branchARes = await request(app)
      .post("/api/branches")
      .set(auth(superAdminToken))
      .send({
        name: `E2E Branch A ${stamp}`,
        salonId: salonAId,
        city: "Mumbai",
      });
    expectSuccess(branchARes, 201);
    const branchAId = branchARes.body.data.id as string;

    const branches = await request(app)
      .get("/api/branches")
      .set(auth(superAdminToken));
    expectSuccess(branches, 200);
    expect(Array.isArray(branches.body.data)).toBe(true);

    const salonAdminEmail = `salon-admin-${stamp}@example.com`;
    const salonAdminPassword = "Password@123";
    const createSalonAdmin = await request(app)
      .post("/api/users/salon-admin")
      .set(auth(superAdminToken))
      .send({
        name: "E2E Salon Admin",
        email: salonAdminEmail,
        phone_number: `9100${String(stamp).slice(-6)}`,
        password: salonAdminPassword,
        salonId: salonAId,
      });
    expectSuccess(createSalonAdmin, 201);

    const salonAdminLogin = await request(app).post("/api/auth/login").send({
      email: salonAdminEmail,
      password: salonAdminPassword,
    });
    expectSuccess(salonAdminLogin, 200);
    expect(salonAdminLogin.body.data.user.salonId).toBe(salonAId);
    const salonAdminToken = salonAdminLogin.body.data.accessToken as string;

    const staffRes = await request(app)
      .post("/api/staff")
      .set(auth(salonAdminToken))
      .send({
        name: "E2E Staff A",
        email: `staff-a-${stamp}@example.com`,
        phone: "9811111111",
        jobRole: "Stylist",
        workingFrom: "10:00",
        workingTo: "19:00",
        weekOff: "MONDAY",
        branchId: branchAId,
      });
    expectSuccess(staffRes, 201);
    const staffAId = staffRes.body.data.id as string;

    const staffList = await request(app)
      .get("/api/staff")
      .set(auth(salonAdminToken));
    expectSuccess(staffList, 200);

    const staffById = await request(app)
      .get(`/api/staff/${staffAId}`)
      .set(auth(salonAdminToken));
    expectSuccess(staffById, 200);

    const staffStatus = await request(app)
      .patch(`/api/staff/${staffAId}/status`)
      .set(auth(salonAdminToken))
      .send({ status: false });
    expectSuccess(staffStatus, 200);

    await request(app)
      .patch(`/api/staff/${staffAId}/status`)
      .set(auth(salonAdminToken))
      .send({ status: true })
      .expect(200);

    const customerRes = await request(app)
      .post("/api/customers")
      .set(auth(salonAdminToken))
      .send({
        name: "E2E Customer A",
        phone: `98${String(stamp).slice(-8)}`,
        email: `customer-a-${stamp}@example.com`,
        gst: "27ABCDE1234F1Z5",
        customNotes: "Prefers morning appointments",
        branchId: branchAId,
      });
    expectSuccess(customerRes, 201);
    const customerAId = customerRes.body.data.id as string;

    const customerList = await request(app)
      .get("/api/customers")
      .set(auth(salonAdminToken));
    expectSuccess(customerList, 200);

    const customerById = await request(app)
      .get(`/api/customers/${customerAId}`)
      .set(auth(salonAdminToken));
    expectSuccess(customerById, 200);

    const mainServiceRes = await request(app)
      .post("/api/main-services")
      .set(auth(salonAdminToken))
      .send({ name: `E2E Hair ${stamp}` });
    expectSuccess(mainServiceRes, 201);
    const mainServiceAId = mainServiceRes.body.data.id as string;

    const mainServices = await request(app)
      .get("/api/main-services")
      .set(auth(salonAdminToken));
    expectSuccess(mainServices, 200);

    const serviceRes = await request(app)
      .post("/api/services")
      .set(auth(salonAdminToken))
      .send({
        name: `E2E Haircut ${stamp}`,
        description: "E2E test service",
        price: 500,
        durationValue: 60,
        durationUnit: "MINUTES",
        branchId: branchAId,
        mainServiceId: mainServiceAId,
      });
    expectSuccess(serviceRes, 201);
    const serviceAId = serviceRes.body.data.id as string;

    const services = await request(app)
      .get("/api/services")
      .set(auth(salonAdminToken));
    expectSuccess(services, 200);

    const startTime = "2030-01-01T10:00:00.000Z";
    const appointmentRes = await request(app)
      .post("/api/appointments")
      .set(auth(salonAdminToken))
      .send({
        branchId: branchAId,
        customerId: customerAId,
        staffId: staffAId,
        serviceIds: [serviceAId],
        startTime,
        bookingNote: "Customer prefers morning slot",
      });
    expectSuccess(appointmentRes, 201);
    const appointmentA = appointmentRes.body.data;
    const appointmentAId = appointmentA.id as string;
    expect(appointmentA.totalDurationMinutes).toBe(60);
    expect(Number(appointmentA.estimatedAmount)).toBe(500);
    expect(new Date(appointmentA.endTime).toISOString()).toBe(
      "2030-01-01T11:00:00.000Z"
    );

    const notCompletedInvoice = await request(app)
      .post(`/api/invoices/from-appointment/${appointmentAId}`)
      .set(auth(salonAdminToken))
      .send({ invoiceType: "BILL_OF_SUPPLY" });
    expectFailure(notCompletedInvoice, 400);

    const conflict = await request(app)
      .post("/api/appointments")
      .set(auth(salonAdminToken))
      .send({
        branchId: branchAId,
        customerId: customerAId,
        staffId: staffAId,
        serviceIds: [serviceAId],
        startTime: "2030-01-01T10:30:00.000Z",
      });
    expectFailure(conflict, 409);

    const appointmentBRes = await request(app)
      .post("/api/appointments")
      .set(auth(salonAdminToken))
      .send({
        branchId: branchAId,
        customerId: customerAId,
        staffId: staffAId,
        serviceIds: [serviceAId],
        startTime: appointmentA.endTime,
      });
    expectSuccess(appointmentBRes, 201);
    const appointmentBId = appointmentBRes.body.data.id as string;

    const appointments = await request(app)
      .get("/api/appointments")
      .set(auth(salonAdminToken));
    expectSuccess(appointments, 200);

    const appointmentById = await request(app)
      .get(`/api/appointments/${appointmentAId}`)
      .set(auth(salonAdminToken));
    expectSuccess(appointmentById, 200);

    const reschedule = await request(app)
      .patch(`/api/appointments/${appointmentBId}/reschedule`)
      .set(auth(salonAdminToken))
      .send({ startTime: "2030-01-01T12:30:00.000Z" });
    expectSuccess(reschedule, 200);

    for (const status of ["CONFIRMED", "CHECKED_IN", "COMPLETED"]) {
      const statusRes = await request(app)
        .patch(`/api/appointments/${appointmentAId}/status`)
        .set(auth(salonAdminToken))
        .send({ status, note: `Moved to ${status}` });
      expectSuccess(statusRes, 200);
      expect(statusRes.body.data.status).toBe(status);
    }

    const tracking = await request(app)
      .get(`/api/appointments/${appointmentAId}/tracking`)
      .set(auth(salonAdminToken));
    expectSuccess(tracking, 200);
    expect(tracking.body.data).toHaveLength(3);
    expect(tracking.body.data[0].oldStatus).toBe("SCHEDULED");
    expect(tracking.body.data[0].newStatus).toBe("CONFIRMED");
    expect(tracking.body.data[0].note).toBe("Moved to CONFIRMED");
    expect(tracking.body.data[0].changedBy.id).toBe(
      salonAdminLogin.body.data.user.id
    );

    const billInvoiceRes = await request(app)
      .post(`/api/invoices/from-appointment/${appointmentAId}`)
      .set(auth(salonAdminToken))
      .send({ invoiceType: "BILL_OF_SUPPLY" });
    expectSuccess(billInvoiceRes, 201);
    const billInvoice = billInvoiceRes.body.data;
    const billInvoiceId = billInvoice.id as string;
    expect(Number(billInvoice.taxAmount)).toBe(0);

    const duplicateInvoice = await request(app)
      .post(`/api/invoices/from-appointment/${appointmentAId}`)
      .set(auth(salonAdminToken))
      .send({ invoiceType: "BILL_OF_SUPPLY" });
    expectFailure(duplicateInvoice, 400);

    await request(app)
      .patch(`/api/appointments/${appointmentBId}/status`)
      .set(auth(salonAdminToken))
      .send({ status: "CONFIRMED" })
      .expect(200);
    await request(app)
      .patch(`/api/appointments/${appointmentBId}/status`)
      .set(auth(salonAdminToken))
      .send({ status: "CHECKED_IN" })
      .expect(200);
    await request(app)
      .patch(`/api/appointments/${appointmentBId}/status`)
      .set(auth(salonAdminToken))
      .send({ status: "COMPLETED" })
      .expect(200);

    const gstInvoiceRes = await request(app)
      .post(`/api/invoices/from-appointment/${appointmentBId}`)
      .set(auth(salonAdminToken))
      .send({ invoiceType: "GST_INVOICE", taxPercent: 18 });
    expectSuccess(gstInvoiceRes, 201);
    expect(Number(gstInvoiceRes.body.data.taxAmount)).toBe(90);

    const invoices = await request(app)
      .get("/api/invoices")
      .set(auth(salonAdminToken));
    expectSuccess(invoices, 200);

    const invoiceById = await request(app)
      .get(`/api/invoices/${billInvoiceId}`)
      .set(auth(salonAdminToken));
    expectSuccess(invoiceById, 200);

    const partialPayment = await request(app)
      .post("/api/payments")
      .set(auth(salonAdminToken))
      .send({
        invoiceId: billInvoiceId,
        amount: 200,
        method: "CASH",
        referenceNo: "E2E-PARTIAL",
      });
    expectSuccess(partialPayment, 201);
    expect(Number(partialPayment.body.data.invoice.paidAmount)).toBe(200);
    expect(Number(partialPayment.body.data.invoice.balanceAmount)).toBe(300);
    expect(partialPayment.body.data.invoice.paymentStatus).toBe("PARTIALLY_PAID");
    const partialPaymentId = partialPayment.body.data.payment.id as string;

    const overPayment = await request(app)
      .post("/api/payments")
      .set(auth(salonAdminToken))
      .send({
        invoiceId: billInvoiceId,
        amount: 301,
        method: "CASH",
      });
    expectFailure(overPayment, 400);

    const fullPayment = await request(app)
      .post("/api/payments")
      .set(auth(salonAdminToken))
      .send({
        invoiceId: billInvoiceId,
        amount: 300,
        method: "UPI",
        referenceNo: "E2E-FULL",
      });
    expectSuccess(fullPayment, 201);
    expect(Number(fullPayment.body.data.invoice.balanceAmount)).toBe(0);
    expect(fullPayment.body.data.invoice.paymentStatus).toBe("PAID");

    const payments = await request(app)
      .get("/api/payments")
      .set(auth(salonAdminToken));
    expectSuccess(payments, 200);

    const paymentById = await request(app)
      .get(`/api/payments/${partialPaymentId}`)
      .set(auth(salonAdminToken));
    expectSuccess(paymentById, 200);

    const salonBRes = await request(app)
      .post("/api/salons")
      .set(auth(superAdminToken))
      .send({ name: `E2E Salon B ${stamp}` });
    expectSuccess(salonBRes, 201);
    const salonBId = salonBRes.body.data.id as string;

    const branchBRes = await request(app)
      .post("/api/branches")
      .set(auth(superAdminToken))
      .send({ name: `E2E Branch B ${stamp}`, salonId: salonBId });
    expectSuccess(branchBRes, 201);
    const branchBId = branchBRes.body.data.id as string;

    const staffBRes = await request(app)
      .post("/api/staff")
      .set(auth(superAdminToken))
      .send({
        name: "E2E Staff B",
        email: `staff-b-${stamp}@example.com`,
        jobRole: "Stylist",
        workingFrom: "10:00",
        workingTo: "19:00",
        weekOff: "TUESDAY",
        salonId: salonBId,
        branchId: branchBId,
      });
    expectSuccess(staffBRes, 201);

    const customerBRes = await request(app)
      .post("/api/customers")
      .set(auth(superAdminToken))
      .send({
        name: "E2E Customer B",
        phone: `97${String(stamp).slice(-8)}`,
        salonId: salonBId,
        branchId: branchBId,
      });
    expectSuccess(customerBRes, 201);

    const mainServiceBRes = await request(app)
      .post("/api/main-services")
      .set(auth(superAdminToken))
      .send({ name: `E2E Skin ${stamp}`, salonId: salonBId });
    expectSuccess(mainServiceBRes, 201);

    const serviceBRes = await request(app)
      .post("/api/services")
      .set(auth(superAdminToken))
      .send({
        name: `E2E Facial ${stamp}`,
        price: 700,
        durationValue: 30,
        durationUnit: "MINUTES",
        salonId: salonBId,
        branchId: branchBId,
        mainServiceId: mainServiceBRes.body.data.id,
      });
    expectSuccess(serviceBRes, 201);

    const crossTenantAppointment = await request(app)
      .post("/api/appointments")
      .set(auth(salonAdminToken))
      .send({
        branchId: branchBId,
        customerId: customerBRes.body.data.id,
        staffId: staffBRes.body.data.id,
        serviceIds: [serviceBRes.body.data.id],
        startTime: "2030-01-02T10:00:00.000Z",
      });
    expectFailure(crossTenantAppointment, 400);
  });
});
