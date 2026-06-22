import { request } from "./api";

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
