import { request, requestBlob } from "./api";

export const salonApi = {
  auth: {
    me: () => request("/api/auth/me"),
  },
  users: {
    list: () => request("/api/users"),
    createSalonAdmin: (body) =>
      request("/api/users/salon-admin", { method: "POST", body }),
    createReceptionist: (body) =>
      request("/api/users/receptionist", { method: "POST", body }),
  },
  salons: {
    list: () => request("/api/salons"),
    create: (body) => request("/api/salons", { method: "POST", body }),
  },
  branches: {
    list: () => request("/api/branches"),
    get: (id) => request(`/api/branches/${id}`),
    create: (body) => request("/api/branches", { method: "POST", body }),
    update: (id, body) =>
      request(`/api/branches/${id}`, { method: "PUT", body }),
    remove: (id) => request(`/api/branches/${id}`, { method: "DELETE" }),
  },
  staff: {
    list: () => request("/api/staff"),
    get: (id) => request(`/api/staff/${id}`),
    create: (body) => request("/api/staff", { method: "POST", body }),
    update: (id, body) =>
      request(`/api/staff/${id}`, { method: "PUT", body }),
    setStatus: (id, status) =>
      request(`/api/staff/${id}/status`, {
        method: "PATCH",
        body: { status },
      }),
    remove: (id) => request(`/api/staff/${id}`, { method: "DELETE" }),
  },
  customers: {
    list: () => request("/api/customers"),
    get: (id) => request(`/api/customers/${id}`),
    create: (body) => request("/api/customers", { method: "POST", body }),
    update: (id, body) =>
      request(`/api/customers/${id}`, { method: "PUT", body }),
    remove: (id) => request(`/api/customers/${id}`, { method: "DELETE" }),
    transactions: (id) => request(`/api/customers/${id}/transactions`),
    addWallet: (id, body) =>
      request(`/api/customers/${id}/wallet/add`, { method: "POST", body }),
  },
  mainServices: {
    list: () => request("/api/main-services"),
    get: (id) => request(`/api/main-services/${id}`),
    create: (body) => request("/api/main-services", { method: "POST", body }),
    update: (id, body) =>
      request(`/api/main-services/${id}`, { method: "PUT", body }),
    setStatus: (id, status) =>
      request(`/api/main-services/${id}/status`, {
        method: "PATCH",
        body: { status },
      }),
    remove: (id) => request(`/api/main-services/${id}`, { method: "DELETE" }),
  },
  services: {
    list: () => request("/api/services"),
    seedDefaults: (body = {}) =>
      request("/api/services/seed-defaults", { method: "POST", body }),
    get: (id) => request(`/api/services/${id}`),
    create: (body) => request("/api/services", { method: "POST", body }),
    update: (id, body) =>
      request(`/api/services/${id}`, { method: "PUT", body }),
    setStatus: (id, status) =>
      request(`/api/services/${id}/status`, {
        method: "PATCH",
        body: { status },
      }),
    remove: (id) => request(`/api/services/${id}`, { method: "DELETE" }),
  },
  appointments: {
    list: (query) => request("/api/appointments", { query }),
    get: (id) => request(`/api/appointments/${id}`),
    create: (body) => request("/api/appointments", { method: "POST", body }),
    update: (id, body) =>
      request(`/api/appointments/${id}`, { method: "PUT", body }),
    setStatus: (id, body) =>
      request(`/api/appointments/${id}/status`, { method: "PATCH", body }),
    reschedule: (id, startTime) =>
      request(`/api/appointments/${id}/reschedule`, {
        method: "PATCH",
        body: { startTime },
      }),
    tracking: (id) => request(`/api/appointments/${id}/tracking`),
    remove: (id) => request(`/api/appointments/${id}`, { method: "DELETE" }),
  },
  invoices: {
    list: (query) => request("/api/invoices", { query }),
    get: (id) => request(`/api/invoices/${id}`),
    fromAppointment: (appointmentId, body) =>
      request(`/api/invoices/from-appointment/${appointmentId}`, {
        method: "POST",
        body,
      }),
    cancel: (id) =>
      request(`/api/invoices/${id}/cancel`, { method: "PATCH" }),
  },
  payments: {
    list: (query) => request("/api/payments", { query }),
    get: (id) => request(`/api/payments/${id}`),
    create: (body) => request("/api/payments", { method: "POST", body }),
  },
  productBrands: {
    list: () => request("/api/product-brands"),
    get: (id) => request(`/api/product-brands/${id}`),
    create: (body) => request("/api/product-brands", { method: "POST", body }),
    update: (id, body) => request(`/api/product-brands/${id}`, { method: "PUT", body }),
    setStatus: (id, status) => request(`/api/product-brands/${id}/status`, { method: "PATCH", body: { status } }),
    remove: (id) => request(`/api/product-brands/${id}`, { method: "DELETE" }),
  },
  products: {
    list: (query) => request("/api/products", { query }),
    lowStock: () => request("/api/products/low-stock"),
    get: (id) => request(`/api/products/${id}`),
    create: (body) => request("/api/products", { method: "POST", body }),
    update: (id, body) => request(`/api/products/${id}`, { method: "PUT", body }),
    setStatus: (id, status) => request(`/api/products/${id}/status`, { method: "PATCH", body: { status } }),
    remove: (id) => request(`/api/products/${id}`, { method: "DELETE" }),
  },
  productPurchases: {
    list: (query) => request("/api/product-purchases", { query }),
    get: (id) => request(`/api/product-purchases/${id}`),
    create: (body) => request("/api/product-purchases", { method: "POST", body }),
  },
  retailSales: {
    list: () => request("/api/retail-sales"),
    get: (id) => request(`/api/retail-sales/${id}`),
    create: (body) => request("/api/retail-sales", { method: "POST", body }),
  },
  attendance: {
    list: (query) => request("/api/attendance", { query }),
    checkIn: (body) => request("/api/attendance/check-in", { method: "POST", body }),
    checkOut: (body) => request("/api/attendance/check-out", { method: "POST", body }),
    mark: (body) => request("/api/attendance/mark", { method: "POST", body }),
  },
  leaves: {
    list: (query) => request("/api/leaves", { query }),
    create: (body) => request("/api/leaves", { method: "POST", body }),
    approve: (id) => request(`/api/leaves/${id}/approve`, { method: "PATCH" }),
    reject: (id, rejectionReason) => request(`/api/leaves/${id}/reject`, { method: "PATCH", body: { rejectionReason } }),
    cancel: (id) => request(`/api/leaves/${id}/cancel`, { method: "PATCH" }),
  },
  salaryConfigs: {
    active: (staffId) => request(`/api/staff/${staffId}/salary-config`),
    create: (staffId, body) => request(`/api/staff/${staffId}/salary-config`, { method: "POST", body }),
    update: (id, body) => request(`/api/salary-configs/${id}`, { method: "PUT", body }),
    setStatus: (id, status) => request(`/api/salary-configs/${id}/status`, { method: "PATCH", body: { status } }),
  },
  salarySlips: {
    list: (query) => request("/api/salary-slips", { query }),
    get: (id) => request(`/api/salary-slips/${id}`),
    generate: (body) => request("/api/salary-slips/generate", { method: "POST", body }),
    markPaid: (id) => request(`/api/salary-slips/${id}/mark-paid`, { method: "PATCH" }),
    cancel: (id) => request(`/api/salary-slips/${id}/cancel`, { method: "PATCH" }),
    pdf: (id) => requestBlob(`/api/salary-slips/${id}/pdf`),
  },
  stockMovements: {
    list: (query) => request("/api/stock-movements", { query }),
    byProduct: (productId) => request(`/api/stock-movements/product/${productId}`),
    createManual: (body) => request("/api/stock-movements/manual", { method: "POST", body }),
  },
  vendors: {
    list: (query) => request("/api/vendors", { query }),
    get: (id) => request(`/api/vendors/${id}`),
    create: (body) => request("/api/vendors", { method: "POST", body }),
    update: (id, body) => request(`/api/vendors/${id}`, { method: "PUT", body }),
    setStatus: (id, status) => request(`/api/vendors/${id}/status`, { method: "PATCH", body: { status } }),
    remove: (id) => request(`/api/vendors/${id}`, { method: "DELETE" }),
  },
  vendorPayments: {
    list: (query) => request("/api/vendor-payments", { query }),
    get: (id) => request(`/api/vendor-payments/${id}`),
    create: (body) => request("/api/vendor-payments", { method: "POST", body }),
  },
  expenses: {
    list: (query) => request("/api/expenses", { query }),
    get: (id) => request(`/api/expenses/${id}`),
    create: (body) => request("/api/expenses", { method: "POST", body }),
    update: (id, body) => request(`/api/expenses/${id}`, { method: "PUT", body }),
    remove: (id) => request(`/api/expenses/${id}`, { method: "DELETE" }),
  },
  expenseCategories: {
    list: (query) => request("/api/expense-categories", { query }),
    get: (id) => request(`/api/expense-categories/${id}`),
    create: (body) => request("/api/expense-categories", { method: "POST", body }),
    update: (id, body) => request(`/api/expense-categories/${id}`, { method: "PUT", body }),
    setStatus: (id, status) => request(`/api/expense-categories/${id}/status`, { method: "PATCH", body: { status } }),
    remove: (id) => request(`/api/expense-categories/${id}`, { method: "DELETE" }),
  },
  reports: {
    inventory: (query) => request("/api/reports/inventory", { query }),
    expenses: (query) => request("/api/reports/expenses", { query }),
    profitSummary: (query) => request("/api/reports/profit-summary", { query }),
    staffPerformance: (query) => request("/api/reports/staff-performance", { query }),
  },
  support: {
    createPublic: (body) =>
      request("/api/support-tickets/public", { method: "POST", body }),
    getPublic: (ticketCode, email) =>
      request(`/api/support-tickets/public/${ticketCode}`, {
        query: { email },
      }),
    create: (body) =>
      request("/api/support-tickets", { method: "POST", body }),
    list: (query) => request("/api/support-tickets", { query }),
    mine: () => request("/api/support-tickets/my"),
    get: (id) => request(`/api/support-tickets/${id}`),
    setStatus: (id, body) =>
      request(`/api/support-tickets/${id}/status`, {
        method: "PATCH",
        body,
      }),
    assign: (id, assignedToId) =>
      request(`/api/support-tickets/${id}/assign`, {
        method: "PATCH",
        body: { assignedToId },
      }),
    addMessage: (id, body) =>
      request(`/api/support-tickets/${id}/messages`, {
        method: "POST",
        body,
      }),
  },
};
