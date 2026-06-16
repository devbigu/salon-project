# Salon Backend End-to-End API Test Report

Generated: 2026-06-16T06:29:05.051Z

Environment: `.env.test` / `salon_test_db`

Notes:
- Request/response JWT values and passwords are redacted.
- IDs, business fields, statuses, and response bodies are from the actual test run.
- The test database was cleaned before this run.

## Summary

- Total API checks: 55
- Passed: 55
- Failed: 0
- Skipped: 0

## Created Test Data IDs

- SUPER_ADMIN User ID: `2614645a-7ab3-4d96-bf00-8ba867cd0e89`
- Salon A ID: `316c156e-1e86-4788-b66d-b7836e1ae722`
- Branch A ID: `0fe95e32-71db-4ecc-a018-5342ccdbae0b`
- SALON_ADMIN User ID: `a231d7b8-05c4-41a3-8ae9-0c888f509489`
- Staff A ID: `5c1a7d0c-ae75-4b99-aeff-4d4e16587615`
- Customer A ID: `a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7`
- Main Service A ID: `cbc109a6-c23e-422a-81e4-04d7a7e85b83`
- Service A ID: `0f5433c4-2702-4b63-9b56-ddcd8d2b1607`
- Appointment A ID: `bbcefcc3-4b88-4cd8-abc4-bccd7438eec0`
- Appointment B ID: `aa27f550-265d-489f-af45-3e5f96c81730`
- Bill Of Supply Invoice ID: `d1cf2640-1dc1-45cf-9c7d-29afe6541fcc`
- GST Invoice ID: `e0c0b52e-4554-4ee0-9918-731ebe406548`
- Partial Payment ID: `024da69e-47e7-4409-9cd1-9c555d8d1e66`
- Salon B ID: `b167ee81-cf0e-4b2f-8515-6c1183a9f81f`
- Branch B ID: `9cbcd305-4c06-41d9-8845-dffe79b9ea35`
- Staff B ID: `93fd2720-8c71-4f40-b85e-8e2386453bc8`
- Customer B ID: `4905b8b1-0de3-414e-aebe-5a775276164f`
- Service B ID: `20391d16-19d2-4a9a-8093-82cd03812ca1`

## Scenario Coverage


- SUPER_ADMIN login: passed
- Create Salon A: passed
- Create Branch A under Salon A: passed
- Create SALON_ADMIN assigned to Salon A: passed
- SALON_ADMIN login includes salonId: passed
- Staff/customer/main-service/service creation: passed
- Appointment amount/endTime calculation: passed
- Appointment conflict rejection: passed
- Exact endTime next appointment allowed: passed
- Status flow SCHEDULED -> CONFIRMED -> CHECKED_IN -> COMPLETED: passed
- Status tracking oldStatus/newStatus/note/changedBy: passed
- Invoice only after completed appointment: passed
- Duplicate invoice rejected: passed
- BILL_OF_SUPPLY taxAmount = 0: passed
- GST_INVOICE taxPercent calculation: passed
- Partial/full payment flow: passed
- Overpayment rejected: passed
- Tenant isolation blocks Salon A admin from Salon B resources: passed

## API Request And Response Log


### 1. Health check

- Route: `GET /api/health`
- Auth: none
- Expected status: `200`
- Actual status: `200`
- Result: PASSED

Request body:
```json
{}
```

Response body:
```json
{
  "success": true,
  "message": "Server is healthy"
}
```

### 2. Register SUPER_ADMIN test user

- Route: `POST /api/auth/register`
- Auth: none
- Expected status: `201`
- Actual status: `201`
- Result: PASSED

Request body:
```json
{
  "name": "Report Super Admin",
  "email": "report-super-1781591343990@example.com",
  "phone_number": "9091343990",
  "password": "<REDACTED>"
}
```

Response body:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "2614645a-7ab3-4d96-bf00-8ba867cd0e89",
      "name": "Report Super Admin",
      "email": "report-super-1781591343990@example.com",
      "phone_number": "9091343990",
      "role": "SUPER_ADMIN",
      "salonId": null,
      "createdAt": "2026-06-16T06:29:04.138Z"
    },
    "accessToken": "<REDACTED>"
  }
}
```

### 3. SUPER_ADMIN login

- Route: `POST /api/auth/login`
- Auth: none
- Expected status: `200`
- Actual status: `200`
- Result: PASSED

Request body:
```json
{
  "email": "report-super-1781591343990@example.com",
  "password": "<REDACTED>"
}
```

Response body:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "2614645a-7ab3-4d96-bf00-8ba867cd0e89",
      "name": "Report Super Admin",
      "email": "report-super-1781591343990@example.com",
      "phone_number": "9091343990",
      "role": "SUPER_ADMIN",
      "salonId": null,
      "createdAt": "2026-06-16T06:29:04.138Z",
      "updatedAt": "2026-06-16T06:29:04.138Z",
      "branchId": null
    },
    "accessToken": "<REDACTED>"
  }
}
```

### 4. Create Salon A

- Route: `POST /api/salons`
- Auth: Bearer <SUPER_ADMIN_ACCESS_TOKEN>
- Expected status: `201`
- Actual status: `201`
- Result: PASSED

Request body:
```json
{
  "name": "Report Salon A 1781591343990",
  "email": "report-salon-a-1781591343990@example.com",
  "phone": "9876500001",
  "addressLine1": "A Street",
  "city": "Mumbai",
  "state": "MH",
  "postalCode": "400001"
}
```

Response body:
```json
{
  "success": true,
  "message": "Salon created successfully",
  "data": {
    "id": "316c156e-1e86-4788-b66d-b7836e1ae722",
    "name": "Report Salon A 1781591343990",
    "addressLine1": "A Street",
    "addressLine2": null,
    "city": "Mumbai",
    "state": "MH",
    "country": null,
    "postalCode": "400001",
    "phone": "9876500001",
    "email": "report-salon-a-1781591343990@example.com",
    "createdAt": "2026-06-16T06:29:04.229Z",
    "updatedAt": "2026-06-16T06:29:04.229Z"
  }
}
```

### 5. Create branch for CRUD check

- Route: `POST /api/branches`
- Auth: Bearer <SUPER_ADMIN_ACCESS_TOKEN>
- Expected status: `201`
- Actual status: `201`
- Result: PASSED

Request body:
```json
{
  "name": "Report Branch CRUD 1781591343990",
  "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
  "city": "Mumbai"
}
```

Response body:
```json
{
  "success": true,
  "message": "Branch created successfully",
  "data": {
    "id": "86bbe093-3d28-4a82-96b7-5e5bb6afaf73",
    "name": "Report Branch CRUD 1781591343990",
    "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
    "addressLine1": null,
    "city": "Mumbai",
    "state": null,
    "postalCode": null,
    "phone": null,
    "createdAt": "2026-06-16T06:29:04.239Z",
    "updatedAt": "2026-06-16T06:29:04.239Z"
  }
}
```

### 6. Get branch by ID

- Route: `GET /api/branches/86bbe093-3d28-4a82-96b7-5e5bb6afaf73`
- Auth: Bearer <SUPER_ADMIN_ACCESS_TOKEN>
- Expected status: `200`
- Actual status: `200`
- Result: PASSED

Request body:
```json
{}
```

Response body:
```json
{
  "success": true,
  "message": "Branch fetched successfully",
  "data": {
    "id": "86bbe093-3d28-4a82-96b7-5e5bb6afaf73",
    "name": "Report Branch CRUD 1781591343990",
    "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
    "addressLine1": null,
    "city": "Mumbai",
    "state": null,
    "postalCode": null,
    "phone": null,
    "createdAt": "2026-06-16T06:29:04.239Z",
    "updatedAt": "2026-06-16T06:29:04.239Z"
  }
}
```

### 7. Update branch by ID

- Route: `PUT /api/branches/86bbe093-3d28-4a82-96b7-5e5bb6afaf73`
- Auth: Bearer <SUPER_ADMIN_ACCESS_TOKEN>
- Expected status: `200`
- Actual status: `200`
- Result: PASSED

Request body:
```json
{
  "name": "Report Branch CRUD Updated 1781591343990"
}
```

Response body:
```json
{
  "success": true,
  "message": "Branch updated successfully",
  "data": {
    "id": "86bbe093-3d28-4a82-96b7-5e5bb6afaf73",
    "name": "Report Branch CRUD Updated 1781591343990",
    "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
    "addressLine1": null,
    "city": "Mumbai",
    "state": null,
    "postalCode": null,
    "phone": null,
    "createdAt": "2026-06-16T06:29:04.239Z",
    "updatedAt": "2026-06-16T06:29:04.262Z"
  }
}
```

### 8. Delete branch by ID

- Route: `DELETE /api/branches/86bbe093-3d28-4a82-96b7-5e5bb6afaf73`
- Auth: Bearer <SUPER_ADMIN_ACCESS_TOKEN>
- Expected status: `200`
- Actual status: `200`
- Result: PASSED

Request body:
```json
{}
```

Response body:
```json
{
  "success": true,
  "message": "Branch deleted successfully"
}
```

### 9. Create Branch A

- Route: `POST /api/branches`
- Auth: Bearer <SUPER_ADMIN_ACCESS_TOKEN>
- Expected status: `201`
- Actual status: `201`
- Result: PASSED

Request body:
```json
{
  "name": "Report Branch A 1781591343990",
  "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
  "city": "Mumbai"
}
```

Response body:
```json
{
  "success": true,
  "message": "Branch created successfully",
  "data": {
    "id": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
    "name": "Report Branch A 1781591343990",
    "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
    "addressLine1": null,
    "city": "Mumbai",
    "state": null,
    "postalCode": null,
    "phone": null,
    "createdAt": "2026-06-16T06:29:04.278Z",
    "updatedAt": "2026-06-16T06:29:04.278Z"
  }
}
```

### 10. List branches

- Route: `GET /api/branches`
- Auth: Bearer <SUPER_ADMIN_ACCESS_TOKEN>
- Expected status: `200`
- Actual status: `200`
- Result: PASSED

Request body:
```json
{}
```

Response body:
```json
{
  "success": true,
  "message": "Branches fetched successfully",
  "data": [
    {
      "id": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
      "name": "Report Branch A 1781591343990",
      "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
      "addressLine1": null,
      "city": "Mumbai",
      "state": null,
      "postalCode": null,
      "phone": null,
      "createdAt": "2026-06-16T06:29:04.278Z",
      "updatedAt": "2026-06-16T06:29:04.278Z",
      "salon": {
        "id": "316c156e-1e86-4788-b66d-b7836e1ae722",
        "name": "Report Salon A 1781591343990"
      }
    }
  ]
}
```

### 11. Create SALON_ADMIN for Salon A

- Route: `POST /api/users/salon-admin`
- Auth: Bearer <SUPER_ADMIN_ACCESS_TOKEN>
- Expected status: `201`
- Actual status: `201`
- Result: PASSED

Request body:
```json
{
  "name": "Report Salon Admin",
  "email": "report-salon-admin-1781591343990@example.com",
  "phone_number": "9191343990",
  "password": "<REDACTED>",
  "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722"
}
```

Response body:
```json
{
  "success": true,
  "message": "Salon admin created successfully",
  "data": {
    "id": "a231d7b8-05c4-41a3-8ae9-0c888f509489",
    "name": "Report Salon Admin",
    "email": "report-salon-admin-1781591343990@example.com",
    "phone_number": "9191343990",
    "role": "SALON_ADMIN",
    "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
    "createdAt": "2026-06-16T06:29:04.372Z"
  }
}
```

### 12. SALON_ADMIN login

- Route: `POST /api/auth/login`
- Auth: none
- Expected status: `200`
- Actual status: `200`
- Result: PASSED

Request body:
```json
{
  "email": "report-salon-admin-1781591343990@example.com",
  "password": "<REDACTED>"
}
```

Response body:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "a231d7b8-05c4-41a3-8ae9-0c888f509489",
      "name": "Report Salon Admin",
      "email": "report-salon-admin-1781591343990@example.com",
      "phone_number": "9191343990",
      "role": "SALON_ADMIN",
      "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
      "createdAt": "2026-06-16T06:29:04.372Z",
      "updatedAt": "2026-06-16T06:29:04.372Z",
      "branchId": null
    },
    "accessToken": "<REDACTED>"
  }
}
```

### 13. Create staff

- Route: `POST /api/staff`
- Auth: Bearer <SALON_ADMIN_ACCESS_TOKEN>
- Expected status: `201`
- Actual status: `201`
- Result: PASSED

Request body:
```json
{
  "name": "Report Staff A",
  "email": "report-staff-a-1781591343990@example.com",
  "phone": "9811111111",
  "jobRole": "Stylist",
  "workingFrom": "10:00",
  "workingTo": "19:00",
  "weekOff": "MONDAY",
  "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b"
}
```

Response body:
```json
{
  "success": true,
  "message": "Staff created successfully",
  "data": {
    "id": "5c1a7d0c-ae75-4b99-aeff-4d4e16587615",
    "name": "Report Staff A",
    "email": "report-staff-a-1781591343990@example.com",
    "phone": "9811111111",
    "jobRole": "Stylist",
    "workingFrom": "10:00",
    "workingTo": "19:00",
    "weekOff": "MONDAY",
    "status": true,
    "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
    "userId": null,
    "reportingManagerId": null,
    "createdAt": "2026-06-16T06:29:04.459Z",
    "updatedAt": "2026-06-16T06:29:04.459Z",
    "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
    "branch": {
      "id": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
      "name": "Report Branch A 1781591343990"
    },
    "reportingManager": null
  }
}
```

### 14. List staff

- Route: `GET /api/staff`
- Auth: Bearer <SALON_ADMIN_ACCESS_TOKEN>
- Expected status: `200`
- Actual status: `200`
- Result: PASSED

Request body:
```json
{}
```

Response body:
```json
{
  "success": true,
  "message": "Staff fetched successfully",
  "data": [
    {
      "id": "5c1a7d0c-ae75-4b99-aeff-4d4e16587615",
      "name": "Report Staff A",
      "email": "report-staff-a-1781591343990@example.com",
      "phone": "9811111111",
      "jobRole": "Stylist",
      "workingFrom": "10:00",
      "workingTo": "19:00",
      "weekOff": "MONDAY",
      "status": true,
      "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
      "userId": null,
      "reportingManagerId": null,
      "createdAt": "2026-06-16T06:29:04.459Z",
      "updatedAt": "2026-06-16T06:29:04.459Z",
      "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
      "branch": {
        "id": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
        "name": "Report Branch A 1781591343990"
      },
      "reportingManager": null
    }
  ]
}
```

### 15. Get staff by ID

- Route: `GET /api/staff/5c1a7d0c-ae75-4b99-aeff-4d4e16587615`
- Auth: Bearer <SALON_ADMIN_ACCESS_TOKEN>
- Expected status: `200`
- Actual status: `200`
- Result: PASSED

Request body:
```json
{}
```

Response body:
```json
{
  "success": true,
  "message": "Staff fetched successfully",
  "data": {
    "id": "5c1a7d0c-ae75-4b99-aeff-4d4e16587615",
    "name": "Report Staff A",
    "email": "report-staff-a-1781591343990@example.com",
    "phone": "9811111111",
    "jobRole": "Stylist",
    "workingFrom": "10:00",
    "workingTo": "19:00",
    "weekOff": "MONDAY",
    "status": true,
    "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
    "userId": null,
    "reportingManagerId": null,
    "createdAt": "2026-06-16T06:29:04.459Z",
    "updatedAt": "2026-06-16T06:29:04.459Z",
    "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
    "branch": {
      "id": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
      "name": "Report Branch A 1781591343990"
    },
    "reportingManager": null
  }
}
```

### 16. Patch staff status false

- Route: `PATCH /api/staff/5c1a7d0c-ae75-4b99-aeff-4d4e16587615/status`
- Auth: Bearer <SALON_ADMIN_ACCESS_TOKEN>
- Expected status: `200`
- Actual status: `200`
- Result: PASSED

Request body:
```json
{
  "status": false
}
```

Response body:
```json
{
  "success": true,
  "message": "Staff status updated successfully",
  "data": {
    "id": "5c1a7d0c-ae75-4b99-aeff-4d4e16587615",
    "name": "Report Staff A",
    "email": "report-staff-a-1781591343990@example.com",
    "phone": "9811111111",
    "jobRole": "Stylist",
    "workingFrom": "10:00",
    "workingTo": "19:00",
    "weekOff": "MONDAY",
    "status": false,
    "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
    "userId": null,
    "reportingManagerId": null,
    "createdAt": "2026-06-16T06:29:04.459Z",
    "updatedAt": "2026-06-16T06:29:04.500Z",
    "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b"
  }
}
```

### 17. Patch staff status true

- Route: `PATCH /api/staff/5c1a7d0c-ae75-4b99-aeff-4d4e16587615/status`
- Auth: Bearer <SALON_ADMIN_ACCESS_TOKEN>
- Expected status: `200`
- Actual status: `200`
- Result: PASSED

Request body:
```json
{
  "status": true
}
```

Response body:
```json
{
  "success": true,
  "message": "Staff status updated successfully",
  "data": {
    "id": "5c1a7d0c-ae75-4b99-aeff-4d4e16587615",
    "name": "Report Staff A",
    "email": "report-staff-a-1781591343990@example.com",
    "phone": "9811111111",
    "jobRole": "Stylist",
    "workingFrom": "10:00",
    "workingTo": "19:00",
    "weekOff": "MONDAY",
    "status": true,
    "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
    "userId": null,
    "reportingManagerId": null,
    "createdAt": "2026-06-16T06:29:04.459Z",
    "updatedAt": "2026-06-16T06:29:04.510Z",
    "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b"
  }
}
```

### 18. Create customer

- Route: `POST /api/customers`
- Auth: Bearer <SALON_ADMIN_ACCESS_TOKEN>
- Expected status: `201`
- Actual status: `201`
- Result: PASSED

Request body:
```json
{
  "name": "Report Customer A",
  "phone": "9891343990",
  "email": "report-customer-a-1781591343990@example.com",
  "gst": "27ABCDE1234F1Z5",
  "customNotes": "Prefers morning appointments",
  "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b"
}
```

Response body:
```json
{
  "success": true,
  "message": "Customer created successfully",
  "data": {
    "id": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
    "customerCode": "ABM905781",
    "name": "Report Customer A",
    "phone": "9891343990",
    "email": "report-customer-a-1781591343990@example.com",
    "gst": "27ABCDE1234F1Z5",
    "customNotes": "Prefers morning appointments",
    "dob": null,
    "anniversaryDate": null,
    "status": "REGULAR",
    "outstandingAmount": "0",
    "walletBalance": "0",
    "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
    "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
    "createdAt": "2026-06-16T06:29:04.525Z",
    "updatedAt": "2026-06-16T06:29:04.525Z",
    "salon": {
      "id": "316c156e-1e86-4788-b66d-b7836e1ae722",
      "name": "Report Salon A 1781591343990"
    },
    "branch": {
      "id": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
      "name": "Report Branch A 1781591343990"
    }
  }
}
```

### 19. List customers

- Route: `GET /api/customers`
- Auth: Bearer <SALON_ADMIN_ACCESS_TOKEN>
- Expected status: `200`
- Actual status: `200`
- Result: PASSED

Request body:
```json
{}
```

Response body:
```json
{
  "success": true,
  "message": "Customers fetched successfully",
  "data": [
    {
      "id": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
      "customerCode": "ABM905781",
      "name": "Report Customer A",
      "phone": "9891343990",
      "email": "report-customer-a-1781591343990@example.com",
      "gst": "27ABCDE1234F1Z5",
      "customNotes": "Prefers morning appointments",
      "dob": null,
      "anniversaryDate": null,
      "status": "REGULAR",
      "outstandingAmount": "0",
      "walletBalance": "0",
      "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
      "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
      "createdAt": "2026-06-16T06:29:04.525Z",
      "updatedAt": "2026-06-16T06:29:04.525Z",
      "branch": {
        "id": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
        "name": "Report Branch A 1781591343990"
      }
    }
  ]
}
```

### 20. Get customer by ID

- Route: `GET /api/customers/a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7`
- Auth: Bearer <SALON_ADMIN_ACCESS_TOKEN>
- Expected status: `200`
- Actual status: `200`
- Result: PASSED

Request body:
```json
{}
```

Response body:
```json
{
  "success": true,
  "message": "Customer fetched successfully",
  "data": {
    "id": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
    "customerCode": "ABM905781",
    "name": "Report Customer A",
    "phone": "9891343990",
    "email": "report-customer-a-1781591343990@example.com",
    "gst": "27ABCDE1234F1Z5",
    "customNotes": "Prefers morning appointments",
    "dob": null,
    "anniversaryDate": null,
    "status": "REGULAR",
    "outstandingAmount": "0",
    "walletBalance": "0",
    "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
    "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
    "createdAt": "2026-06-16T06:29:04.525Z",
    "updatedAt": "2026-06-16T06:29:04.525Z",
    "branch": {
      "id": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
      "name": "Report Branch A 1781591343990"
    },
    "transactions": []
  }
}
```

### 21. Create main service

- Route: `POST /api/main-services`
- Auth: Bearer <SALON_ADMIN_ACCESS_TOKEN>
- Expected status: `201`
- Actual status: `201`
- Result: PASSED

Request body:
```json
{
  "name": "Report Hair 1781591343990"
}
```

Response body:
```json
{
  "success": true,
  "message": "Main service created successfully",
  "data": {
    "id": "cbc109a6-c23e-422a-81e4-04d7a7e85b83",
    "name": "Report Hair 1781591343990",
    "status": true,
    "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
    "createdAt": "2026-06-16T06:29:04.552Z",
    "updatedAt": "2026-06-16T06:29:04.552Z",
    "salon": {
      "id": "316c156e-1e86-4788-b66d-b7836e1ae722",
      "name": "Report Salon A 1781591343990"
    }
  }
}
```

### 22. List main services

- Route: `GET /api/main-services`
- Auth: Bearer <SALON_ADMIN_ACCESS_TOKEN>
- Expected status: `200`
- Actual status: `200`
- Result: PASSED

Request body:
```json
{}
```

Response body:
```json
{
  "success": true,
  "message": "Main services fetched successfully",
  "data": [
    {
      "id": "cbc109a6-c23e-422a-81e4-04d7a7e85b83",
      "name": "Report Hair 1781591343990",
      "status": true,
      "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
      "createdAt": "2026-06-16T06:29:04.552Z",
      "updatedAt": "2026-06-16T06:29:04.552Z",
      "services": []
    }
  ]
}
```

### 23. Create service

- Route: `POST /api/services`
- Auth: Bearer <SALON_ADMIN_ACCESS_TOKEN>
- Expected status: `201`
- Actual status: `201`
- Result: PASSED

Request body:
```json
{
  "name": "Report Haircut 1781591343990",
  "description": "Report test service",
  "price": 500,
  "durationValue": 60,
  "durationUnit": "MINUTES",
  "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
  "mainServiceId": "cbc109a6-c23e-422a-81e4-04d7a7e85b83"
}
```

Response body:
```json
{
  "success": true,
  "message": "Service created successfully",
  "data": {
    "id": "0f5433c4-2702-4b63-9b56-ddcd8d2b1607",
    "name": "Report Haircut 1781591343990",
    "description": "Report test service",
    "price": "500",
    "durationValue": 60,
    "durationUnit": "MINUTES",
    "status": true,
    "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
    "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
    "mainServiceId": "cbc109a6-c23e-422a-81e4-04d7a7e85b83",
    "createdAt": "2026-06-16T06:29:04.575Z",
    "updatedAt": "2026-06-16T06:29:04.575Z",
    "salon": {
      "id": "316c156e-1e86-4788-b66d-b7836e1ae722",
      "name": "Report Salon A 1781591343990"
    },
    "branch": {
      "id": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
      "name": "Report Branch A 1781591343990"
    },
    "mainService": {
      "id": "cbc109a6-c23e-422a-81e4-04d7a7e85b83",
      "name": "Report Hair 1781591343990"
    }
  }
}
```

### 24. List services

- Route: `GET /api/services`
- Auth: Bearer <SALON_ADMIN_ACCESS_TOKEN>
- Expected status: `200`
- Actual status: `200`
- Result: PASSED

Request body:
```json
{}
```

Response body:
```json
{
  "success": true,
  "message": "Services fetched successfully",
  "data": [
    {
      "id": "0f5433c4-2702-4b63-9b56-ddcd8d2b1607",
      "name": "Report Haircut 1781591343990",
      "description": "Report test service",
      "price": "500",
      "durationValue": 60,
      "durationUnit": "MINUTES",
      "status": true,
      "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
      "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
      "mainServiceId": "cbc109a6-c23e-422a-81e4-04d7a7e85b83",
      "createdAt": "2026-06-16T06:29:04.575Z",
      "updatedAt": "2026-06-16T06:29:04.575Z",
      "branch": {
        "id": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
        "name": "Report Branch A 1781591343990"
      },
      "mainService": {
        "id": "cbc109a6-c23e-422a-81e4-04d7a7e85b83",
        "name": "Report Hair 1781591343990"
      }
    }
  ]
}
```

### 25. Create appointment A

- Route: `POST /api/appointments`
- Auth: Bearer <SALON_ADMIN_ACCESS_TOKEN>
- Expected status: `201`
- Actual status: `201`
- Result: PASSED

Request body:
```json
{
  "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
  "customerId": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
  "staffId": "5c1a7d0c-ae75-4b99-aeff-4d4e16587615",
  "serviceIds": [
    "0f5433c4-2702-4b63-9b56-ddcd8d2b1607"
  ],
  "startTime": "2030-01-01T10:00:00.000Z",
  "bookingNote": "Customer prefers morning slot"
}
```

Response body:
```json
{
  "success": true,
  "message": "Appointment created successfully",
  "data": {
    "id": "bbcefcc3-4b88-4cd8-abc4-bccd7438eec0",
    "appointmentCode": "APT1781591344608fb6de9f8",
    "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
    "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
    "customerId": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
    "staffId": "5c1a7d0c-ae75-4b99-aeff-4d4e16587615",
    "startTime": "2030-01-01T10:00:00.000Z",
    "endTime": "2030-01-01T11:00:00.000Z",
    "totalDurationMinutes": 60,
    "estimatedAmount": "500",
    "status": "SCHEDULED",
    "bookingNote": "Customer prefers morning slot",
    "internalNote": null,
    "createdAt": "2026-06-16T06:29:04.627Z",
    "updatedAt": "2026-06-16T06:29:04.627Z",
    "customer": {
      "id": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
      "name": "Report Customer A",
      "phone": "9891343990",
      "customerCode": "ABM905781"
    },
    "staff": {
      "id": "5c1a7d0c-ae75-4b99-aeff-4d4e16587615",
      "name": "Report Staff A",
      "jobRole": "Stylist"
    },
    "branch": {
      "id": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
      "name": "Report Branch A 1781591343990"
    },
    "services": [
      {
        "id": "819f2874-d4aa-4d9f-bf58-947daaac1cd5",
        "appointmentId": "bbcefcc3-4b88-4cd8-abc4-bccd7438eec0",
        "serviceId": "0f5433c4-2702-4b63-9b56-ddcd8d2b1607",
        "serviceName": "Report Haircut 1781591343990",
        "price": "500",
        "durationValue": 60,
        "durationUnit": "MINUTES",
        "createdAt": "2026-06-16T06:29:04.627Z",
        "service": {
          "id": "0f5433c4-2702-4b63-9b56-ddcd8d2b1607",
          "name": "Report Haircut 1781591343990"
        }
      }
    ]
  }
}
```

### 26. Reject invoice before appointment completion

- Route: `POST /api/invoices/from-appointment/bbcefcc3-4b88-4cd8-abc4-bccd7438eec0`
- Auth: Bearer <SALON_ADMIN_ACCESS_TOKEN>
- Expected status: `400`
- Actual status: `400`
- Result: PASSED

Request body:
```json
{
  "invoiceType": "BILL_OF_SUPPLY"
}
```

Response body:
```json
{
  "success": false,
  "message": "Only completed appointments can be converted to invoice"
}
```

### 27. Reject overlapping appointment for same staff

- Route: `POST /api/appointments`
- Auth: Bearer <SALON_ADMIN_ACCESS_TOKEN>
- Expected status: `409`
- Actual status: `409`
- Result: PASSED

Request body:
```json
{
  "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
  "customerId": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
  "staffId": "5c1a7d0c-ae75-4b99-aeff-4d4e16587615",
  "serviceIds": [
    "0f5433c4-2702-4b63-9b56-ddcd8d2b1607"
  ],
  "startTime": "2030-01-01T10:30:00.000Z"
}
```

Response body:
```json
{
  "success": false,
  "message": "Staff is already booked for this time slot"
}
```

### 28. Create appointment exactly after previous endTime

- Route: `POST /api/appointments`
- Auth: Bearer <SALON_ADMIN_ACCESS_TOKEN>
- Expected status: `201`
- Actual status: `201`
- Result: PASSED

Request body:
```json
{
  "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
  "customerId": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
  "staffId": "5c1a7d0c-ae75-4b99-aeff-4d4e16587615",
  "serviceIds": [
    "0f5433c4-2702-4b63-9b56-ddcd8d2b1607"
  ],
  "startTime": "2030-01-01T11:00:00.000Z"
}
```

Response body:
```json
{
  "success": true,
  "message": "Appointment created successfully",
  "data": {
    "id": "aa27f550-265d-489f-af45-3e5f96c81730",
    "appointmentCode": "APT17815913446911be84ab7",
    "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
    "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
    "customerId": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
    "staffId": "5c1a7d0c-ae75-4b99-aeff-4d4e16587615",
    "startTime": "2030-01-01T11:00:00.000Z",
    "endTime": "2030-01-01T12:00:00.000Z",
    "totalDurationMinutes": 60,
    "estimatedAmount": "500",
    "status": "SCHEDULED",
    "bookingNote": null,
    "internalNote": null,
    "createdAt": "2026-06-16T06:29:04.694Z",
    "updatedAt": "2026-06-16T06:29:04.694Z",
    "customer": {
      "id": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
      "name": "Report Customer A",
      "phone": "9891343990",
      "customerCode": "ABM905781"
    },
    "staff": {
      "id": "5c1a7d0c-ae75-4b99-aeff-4d4e16587615",
      "name": "Report Staff A",
      "jobRole": "Stylist"
    },
    "branch": {
      "id": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
      "name": "Report Branch A 1781591343990"
    },
    "services": [
      {
        "id": "b23773b5-bbbd-4ff1-8591-68186b7ca4b3",
        "appointmentId": "aa27f550-265d-489f-af45-3e5f96c81730",
        "serviceId": "0f5433c4-2702-4b63-9b56-ddcd8d2b1607",
        "serviceName": "Report Haircut 1781591343990",
        "price": "500",
        "durationValue": 60,
        "durationUnit": "MINUTES",
        "createdAt": "2026-06-16T06:29:04.694Z",
        "service": {
          "id": "0f5433c4-2702-4b63-9b56-ddcd8d2b1607",
          "name": "Report Haircut 1781591343990"
        }
      }
    ]
  }
}
```

### 29. List appointments

- Route: `GET /api/appointments`
- Auth: Bearer <SALON_ADMIN_ACCESS_TOKEN>
- Expected status: `200`
- Actual status: `200`
- Result: PASSED

Request body:
```json
{}
```

Response body:
```json
{
  "success": true,
  "message": "Appointments fetched successfully",
  "data": [
    {
      "id": "bbcefcc3-4b88-4cd8-abc4-bccd7438eec0",
      "appointmentCode": "APT1781591344608fb6de9f8",
      "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
      "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
      "customerId": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
      "staffId": "5c1a7d0c-ae75-4b99-aeff-4d4e16587615",
      "startTime": "2030-01-01T10:00:00.000Z",
      "endTime": "2030-01-01T11:00:00.000Z",
      "totalDurationMinutes": 60,
      "estimatedAmount": "500",
      "status": "SCHEDULED",
      "bookingNote": "Customer prefers morning slot",
      "internalNote": null,
      "createdAt": "2026-06-16T06:29:04.627Z",
      "updatedAt": "2026-06-16T06:29:04.627Z",
      "branch": {
        "id": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
        "name": "Report Branch A 1781591343990"
      },
      "customer": {
        "id": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
        "name": "Report Customer A",
        "phone": "9891343990",
        "customerCode": "ABM905781"
      },
      "staff": {
        "id": "5c1a7d0c-ae75-4b99-aeff-4d4e16587615",
        "name": "Report Staff A",
        "jobRole": "Stylist"
      },
      "services": [
        {
          "id": "819f2874-d4aa-4d9f-bf58-947daaac1cd5",
          "appointmentId": "bbcefcc3-4b88-4cd8-abc4-bccd7438eec0",
          "serviceId": "0f5433c4-2702-4b63-9b56-ddcd8d2b1607",
          "serviceName": "Report Haircut 1781591343990",
          "price": "500",
          "durationValue": 60,
          "durationUnit": "MINUTES",
          "createdAt": "2026-06-16T06:29:04.627Z"
        }
      ]
    },
    {
      "id": "aa27f550-265d-489f-af45-3e5f96c81730",
      "appointmentCode": "APT17815913446911be84ab7",
      "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
      "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
      "customerId": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
      "staffId": "5c1a7d0c-ae75-4b99-aeff-4d4e16587615",
      "startTime": "2030-01-01T11:00:00.000Z",
      "endTime": "2030-01-01T12:00:00.000Z",
      "totalDurationMinutes": 60,
      "estimatedAmount": "500",
      "status": "SCHEDULED",
      "bookingNote": null,
      "internalNote": null,
      "createdAt": "2026-06-16T06:29:04.694Z",
      "updatedAt": "2026-06-16T06:29:04.694Z",
      "branch": {
        "id": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
        "name": "Report Branch A 1781591343990"
      },
      "customer": {
        "id": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
        "name": "Report Customer A",
        "phone": "9891343990",
        "customerCode": "ABM905781"
      },
      "staff": {
        "id": "5c1a7d0c-ae75-4b99-aeff-4d4e16587615",
        "name": "Report Staff A",
        "jobRole": "Stylist"
      },
      "services": [
        {
          "id": "b23773b5-bbbd-4ff1-8591-68186b7ca4b3",
          "appointmentId": "aa27f550-265d-489f-af45-3e5f96c81730",
          "serviceId": "0f5433c4-2702-4b63-9b56-ddcd8d2b1607",
          "serviceName": "Report Haircut 1781591343990",
          "price": "500",
          "durationValue": 60,
          "durationUnit": "MINUTES",
          "createdAt": "2026-06-16T06:29:04.694Z"
        }
      ]
    }
  ]
}
```

### 30. Get appointment by ID

- Route: `GET /api/appointments/bbcefcc3-4b88-4cd8-abc4-bccd7438eec0`
- Auth: Bearer <SALON_ADMIN_ACCESS_TOKEN>
- Expected status: `200`
- Actual status: `200`
- Result: PASSED

Request body:
```json
{}
```

Response body:
```json
{
  "success": true,
  "message": "Appointment fetched successfully",
  "data": {
    "id": "bbcefcc3-4b88-4cd8-abc4-bccd7438eec0",
    "appointmentCode": "APT1781591344608fb6de9f8",
    "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
    "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
    "customerId": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
    "staffId": "5c1a7d0c-ae75-4b99-aeff-4d4e16587615",
    "startTime": "2030-01-01T10:00:00.000Z",
    "endTime": "2030-01-01T11:00:00.000Z",
    "totalDurationMinutes": 60,
    "estimatedAmount": "500",
    "status": "SCHEDULED",
    "bookingNote": "Customer prefers morning slot",
    "internalNote": null,
    "createdAt": "2026-06-16T06:29:04.627Z",
    "updatedAt": "2026-06-16T06:29:04.627Z",
    "branch": {
      "id": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
      "name": "Report Branch A 1781591343990"
    },
    "customer": {
      "id": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
      "name": "Report Customer A",
      "phone": "9891343990",
      "customerCode": "ABM905781",
      "outstandingAmount": "0",
      "walletBalance": "0"
    },
    "staff": {
      "id": "5c1a7d0c-ae75-4b99-aeff-4d4e16587615",
      "name": "Report Staff A",
      "jobRole": "Stylist"
    },
    "services": [
      {
        "id": "819f2874-d4aa-4d9f-bf58-947daaac1cd5",
        "appointmentId": "bbcefcc3-4b88-4cd8-abc4-bccd7438eec0",
        "serviceId": "0f5433c4-2702-4b63-9b56-ddcd8d2b1607",
        "serviceName": "Report Haircut 1781591343990",
        "price": "500",
        "durationValue": 60,
        "durationUnit": "MINUTES",
        "createdAt": "2026-06-16T06:29:04.627Z",
        "service": {
          "id": "0f5433c4-2702-4b63-9b56-ddcd8d2b1607",
          "name": "Report Haircut 1781591343990"
        }
      }
    ]
  }
}
```

### 31. Reschedule appointment B

- Route: `PATCH /api/appointments/aa27f550-265d-489f-af45-3e5f96c81730/reschedule`
- Auth: Bearer <SALON_ADMIN_ACCESS_TOKEN>
- Expected status: `200`
- Actual status: `200`
- Result: PASSED

Request body:
```json
{
  "startTime": "2030-01-01T12:30:00.000Z"
}
```

Response body:
```json
{
  "success": true,
  "message": "Appointment rescheduled successfully",
  "data": {
    "id": "aa27f550-265d-489f-af45-3e5f96c81730",
    "appointmentCode": "APT17815913446911be84ab7",
    "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
    "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
    "customerId": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
    "staffId": "5c1a7d0c-ae75-4b99-aeff-4d4e16587615",
    "startTime": "2030-01-01T12:30:00.000Z",
    "endTime": "2030-01-01T13:30:00.000Z",
    "totalDurationMinutes": 60,
    "estimatedAmount": "500",
    "status": "SCHEDULED",
    "bookingNote": null,
    "internalNote": null,
    "createdAt": "2026-06-16T06:29:04.694Z",
    "updatedAt": "2026-06-16T06:29:04.729Z",
    "customer": {
      "id": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
      "name": "Report Customer A",
      "phone": "9891343990",
      "customerCode": "ABM905781"
    },
    "staff": {
      "id": "5c1a7d0c-ae75-4b99-aeff-4d4e16587615",
      "name": "Report Staff A",
      "jobRole": "Stylist"
    },
    "branch": {
      "id": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
      "name": "Report Branch A 1781591343990"
    },
    "services": [
      {
        "id": "b23773b5-bbbd-4ff1-8591-68186b7ca4b3",
        "appointmentId": "aa27f550-265d-489f-af45-3e5f96c81730",
        "serviceId": "0f5433c4-2702-4b63-9b56-ddcd8d2b1607",
        "serviceName": "Report Haircut 1781591343990",
        "price": "500",
        "durationValue": 60,
        "durationUnit": "MINUTES",
        "createdAt": "2026-06-16T06:29:04.694Z",
        "service": {
          "id": "0f5433c4-2702-4b63-9b56-ddcd8d2b1607",
          "name": "Report Haircut 1781591343990"
        }
      }
    ]
  }
}
```

### 32. Update appointment A status to CONFIRMED

- Route: `PATCH /api/appointments/bbcefcc3-4b88-4cd8-abc4-bccd7438eec0/status`
- Auth: Bearer <SALON_ADMIN_ACCESS_TOKEN>
- Expected status: `200`
- Actual status: `200`
- Result: PASSED

Request body:
```json
{
  "status": "CONFIRMED",
  "note": "Moved to CONFIRMED"
}
```

Response body:
```json
{
  "success": true,
  "message": "Appointment status updated successfully",
  "data": {
    "id": "bbcefcc3-4b88-4cd8-abc4-bccd7438eec0",
    "appointmentCode": "APT1781591344608fb6de9f8",
    "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
    "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
    "customerId": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
    "staffId": "5c1a7d0c-ae75-4b99-aeff-4d4e16587615",
    "startTime": "2030-01-01T10:00:00.000Z",
    "endTime": "2030-01-01T11:00:00.000Z",
    "totalDurationMinutes": 60,
    "estimatedAmount": "500",
    "status": "CONFIRMED",
    "bookingNote": "Customer prefers morning slot",
    "internalNote": null,
    "createdAt": "2026-06-16T06:29:04.627Z",
    "updatedAt": "2026-06-16T06:29:04.745Z",
    "customer": {
      "id": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
      "name": "Report Customer A",
      "phone": "9891343990",
      "customerCode": "ABM905781"
    },
    "staff": {
      "id": "5c1a7d0c-ae75-4b99-aeff-4d4e16587615",
      "name": "Report Staff A",
      "jobRole": "Stylist"
    },
    "branch": {
      "id": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
      "name": "Report Branch A 1781591343990"
    },
    "services": [
      {
        "id": "819f2874-d4aa-4d9f-bf58-947daaac1cd5",
        "appointmentId": "bbcefcc3-4b88-4cd8-abc4-bccd7438eec0",
        "serviceId": "0f5433c4-2702-4b63-9b56-ddcd8d2b1607",
        "serviceName": "Report Haircut 1781591343990",
        "price": "500",
        "durationValue": 60,
        "durationUnit": "MINUTES",
        "createdAt": "2026-06-16T06:29:04.627Z"
      }
    ],
    "statusHistory": []
  }
}
```

### 33. Update appointment A status to CHECKED_IN

- Route: `PATCH /api/appointments/bbcefcc3-4b88-4cd8-abc4-bccd7438eec0/status`
- Auth: Bearer <SALON_ADMIN_ACCESS_TOKEN>
- Expected status: `200`
- Actual status: `200`
- Result: PASSED

Request body:
```json
{
  "status": "CHECKED_IN",
  "note": "Moved to CHECKED_IN"
}
```

Response body:
```json
{
  "success": true,
  "message": "Appointment status updated successfully",
  "data": {
    "id": "bbcefcc3-4b88-4cd8-abc4-bccd7438eec0",
    "appointmentCode": "APT1781591344608fb6de9f8",
    "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
    "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
    "customerId": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
    "staffId": "5c1a7d0c-ae75-4b99-aeff-4d4e16587615",
    "startTime": "2030-01-01T10:00:00.000Z",
    "endTime": "2030-01-01T11:00:00.000Z",
    "totalDurationMinutes": 60,
    "estimatedAmount": "500",
    "status": "CHECKED_IN",
    "bookingNote": "Customer prefers morning slot",
    "internalNote": null,
    "createdAt": "2026-06-16T06:29:04.627Z",
    "updatedAt": "2026-06-16T06:29:04.763Z",
    "customer": {
      "id": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
      "name": "Report Customer A",
      "phone": "9891343990",
      "customerCode": "ABM905781"
    },
    "staff": {
      "id": "5c1a7d0c-ae75-4b99-aeff-4d4e16587615",
      "name": "Report Staff A",
      "jobRole": "Stylist"
    },
    "branch": {
      "id": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
      "name": "Report Branch A 1781591343990"
    },
    "services": [
      {
        "id": "819f2874-d4aa-4d9f-bf58-947daaac1cd5",
        "appointmentId": "bbcefcc3-4b88-4cd8-abc4-bccd7438eec0",
        "serviceId": "0f5433c4-2702-4b63-9b56-ddcd8d2b1607",
        "serviceName": "Report Haircut 1781591343990",
        "price": "500",
        "durationValue": 60,
        "durationUnit": "MINUTES",
        "createdAt": "2026-06-16T06:29:04.627Z"
      }
    ],
    "statusHistory": [
      {
        "id": "7d73242e-3b80-45d9-9d62-1c309dfde21e",
        "appointmentId": "bbcefcc3-4b88-4cd8-abc4-bccd7438eec0",
        "oldStatus": "SCHEDULED",
        "newStatus": "CONFIRMED",
        "note": "Moved to CONFIRMED",
        "changedById": "a231d7b8-05c4-41a3-8ae9-0c888f509489",
        "createdAt": "2026-06-16T06:29:04.751Z"
      }
    ]
  }
}
```

### 34. Update appointment A status to COMPLETED

- Route: `PATCH /api/appointments/bbcefcc3-4b88-4cd8-abc4-bccd7438eec0/status`
- Auth: Bearer <SALON_ADMIN_ACCESS_TOKEN>
- Expected status: `200`
- Actual status: `200`
- Result: PASSED

Request body:
```json
{
  "status": "COMPLETED",
  "note": "Moved to COMPLETED"
}
```

Response body:
```json
{
  "success": true,
  "message": "Appointment status updated successfully",
  "data": {
    "id": "bbcefcc3-4b88-4cd8-abc4-bccd7438eec0",
    "appointmentCode": "APT1781591344608fb6de9f8",
    "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
    "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
    "customerId": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
    "staffId": "5c1a7d0c-ae75-4b99-aeff-4d4e16587615",
    "startTime": "2030-01-01T10:00:00.000Z",
    "endTime": "2030-01-01T11:00:00.000Z",
    "totalDurationMinutes": 60,
    "estimatedAmount": "500",
    "status": "COMPLETED",
    "bookingNote": "Customer prefers morning slot",
    "internalNote": null,
    "createdAt": "2026-06-16T06:29:04.627Z",
    "updatedAt": "2026-06-16T06:29:04.786Z",
    "customer": {
      "id": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
      "name": "Report Customer A",
      "phone": "9891343990",
      "customerCode": "ABM905781"
    },
    "staff": {
      "id": "5c1a7d0c-ae75-4b99-aeff-4d4e16587615",
      "name": "Report Staff A",
      "jobRole": "Stylist"
    },
    "branch": {
      "id": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
      "name": "Report Branch A 1781591343990"
    },
    "services": [
      {
        "id": "819f2874-d4aa-4d9f-bf58-947daaac1cd5",
        "appointmentId": "bbcefcc3-4b88-4cd8-abc4-bccd7438eec0",
        "serviceId": "0f5433c4-2702-4b63-9b56-ddcd8d2b1607",
        "serviceName": "Report Haircut 1781591343990",
        "price": "500",
        "durationValue": 60,
        "durationUnit": "MINUTES",
        "createdAt": "2026-06-16T06:29:04.627Z"
      }
    ],
    "statusHistory": [
      {
        "id": "756dba36-7517-4f5e-8b1b-6890f07e2006",
        "appointmentId": "bbcefcc3-4b88-4cd8-abc4-bccd7438eec0",
        "oldStatus": "CONFIRMED",
        "newStatus": "CHECKED_IN",
        "note": "Moved to CHECKED_IN",
        "changedById": "a231d7b8-05c4-41a3-8ae9-0c888f509489",
        "createdAt": "2026-06-16T06:29:04.771Z"
      },
      {
        "id": "7d73242e-3b80-45d9-9d62-1c309dfde21e",
        "appointmentId": "bbcefcc3-4b88-4cd8-abc4-bccd7438eec0",
        "oldStatus": "SCHEDULED",
        "newStatus": "CONFIRMED",
        "note": "Moved to CONFIRMED",
        "changedById": "a231d7b8-05c4-41a3-8ae9-0c888f509489",
        "createdAt": "2026-06-16T06:29:04.751Z"
      }
    ]
  }
}
```

### 35. Get appointment A tracking

- Route: `GET /api/appointments/bbcefcc3-4b88-4cd8-abc4-bccd7438eec0/tracking`
- Auth: Bearer <SALON_ADMIN_ACCESS_TOKEN>
- Expected status: `200`
- Actual status: `200`
- Result: PASSED

Request body:
```json
{}
```

Response body:
```json
{
  "success": true,
  "message": "Appointment tracking fetched successfully",
  "data": [
    {
      "id": "7d73242e-3b80-45d9-9d62-1c309dfde21e",
      "appointmentId": "bbcefcc3-4b88-4cd8-abc4-bccd7438eec0",
      "oldStatus": "SCHEDULED",
      "newStatus": "CONFIRMED",
      "note": "Moved to CONFIRMED",
      "changedById": "a231d7b8-05c4-41a3-8ae9-0c888f509489",
      "createdAt": "2026-06-16T06:29:04.751Z",
      "changedBy": {
        "id": "a231d7b8-05c4-41a3-8ae9-0c888f509489",
        "name": "Report Salon Admin",
        "email": "report-salon-admin-1781591343990@example.com",
        "role": "SALON_ADMIN"
      }
    },
    {
      "id": "756dba36-7517-4f5e-8b1b-6890f07e2006",
      "appointmentId": "bbcefcc3-4b88-4cd8-abc4-bccd7438eec0",
      "oldStatus": "CONFIRMED",
      "newStatus": "CHECKED_IN",
      "note": "Moved to CHECKED_IN",
      "changedById": "a231d7b8-05c4-41a3-8ae9-0c888f509489",
      "createdAt": "2026-06-16T06:29:04.771Z",
      "changedBy": {
        "id": "a231d7b8-05c4-41a3-8ae9-0c888f509489",
        "name": "Report Salon Admin",
        "email": "report-salon-admin-1781591343990@example.com",
        "role": "SALON_ADMIN"
      }
    },
    {
      "id": "7aa03ac4-b01b-4b85-88b2-ef453908096f",
      "appointmentId": "bbcefcc3-4b88-4cd8-abc4-bccd7438eec0",
      "oldStatus": "CHECKED_IN",
      "newStatus": "COMPLETED",
      "note": "Moved to COMPLETED",
      "changedById": "a231d7b8-05c4-41a3-8ae9-0c888f509489",
      "createdAt": "2026-06-16T06:29:04.791Z",
      "changedBy": {
        "id": "a231d7b8-05c4-41a3-8ae9-0c888f509489",
        "name": "Report Salon Admin",
        "email": "report-salon-admin-1781591343990@example.com",
        "role": "SALON_ADMIN"
      }
    }
  ]
}
```

### 36. Create BILL_OF_SUPPLY invoice from completed appointment

- Route: `POST /api/invoices/from-appointment/bbcefcc3-4b88-4cd8-abc4-bccd7438eec0`
- Auth: Bearer <SALON_ADMIN_ACCESS_TOKEN>
- Expected status: `201`
- Actual status: `201`
- Result: PASSED

Request body:
```json
{
  "invoiceType": "BILL_OF_SUPPLY"
}
```

Response body:
```json
{
  "success": true,
  "message": "Invoice created successfully",
  "data": {
    "id": "d1cf2640-1dc1-45cf-9c7d-29afe6541fcc",
    "invoiceCode": "INV1781591344813",
    "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
    "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
    "customerId": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
    "appointmentId": "bbcefcc3-4b88-4cd8-abc4-bccd7438eec0",
    "invoiceType": "BILL_OF_SUPPLY",
    "invoiceDate": "2026-06-16T06:29:04.817Z",
    "salonName": "Report Salon A 1781591343990",
    "salonPhone": "9876500001",
    "salonEmail": "report-salon-a-1781591343990@example.com",
    "salonAddress": "A Street, Mumbai, MH, 400001",
    "salonGst": null,
    "customerName": "Report Customer A",
    "customerPhone": "9891343990",
    "customerEmail": "report-customer-a-1781591343990@example.com",
    "customerAddress": null,
    "customerGst": "27ABCDE1234F1Z5",
    "subtotalAmount": "500",
    "discountAmount": "0",
    "processingFeeAmount": "0",
    "taxAmount": "0",
    "totalAmount": "500",
    "paidAmount": "0",
    "balanceAmount": "500",
    "status": "ISSUED",
    "paymentStatus": "UNPAID",
    "billingNote": null,
    "footerNote": null,
    "createdAt": "2026-06-16T06:29:04.817Z",
    "updatedAt": "2026-06-16T06:29:04.817Z",
    "salon": {
      "id": "316c156e-1e86-4788-b66d-b7836e1ae722",
      "name": "Report Salon A 1781591343990"
    },
    "branch": {
      "id": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
      "name": "Report Branch A 1781591343990"
    },
    "customer": {
      "id": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
      "name": "Report Customer A",
      "phone": "9891343990",
      "customerCode": "ABM905781"
    },
    "appointment": {
      "id": "bbcefcc3-4b88-4cd8-abc4-bccd7438eec0",
      "appointmentCode": "APT1781591344608fb6de9f8",
      "status": "COMPLETED"
    },
    "items": [
      {
        "id": "d03cbc23-c417-427e-ae1f-2401cf6c4fed",
        "invoiceId": "d1cf2640-1dc1-45cf-9c7d-29afe6541fcc",
        "serviceId": "0f5433c4-2702-4b63-9b56-ddcd8d2b1607",
        "itemCode": "0f5433c4",
        "description": "Report Haircut 1781591343990",
        "serviceName": "Report Haircut 1781591343990",
        "quantity": 1,
        "unitPrice": "500",
        "discountAmount": "0",
        "taxPercent": "0",
        "taxAmount": "0",
        "lineTotal": "500",
        "createdAt": "2026-06-16T06:29:04.817Z"
      }
    ],
    "payments": []
  }
}
```

### 37. Reject duplicate invoice for same appointment

- Route: `POST /api/invoices/from-appointment/bbcefcc3-4b88-4cd8-abc4-bccd7438eec0`
- Auth: Bearer <SALON_ADMIN_ACCESS_TOKEN>
- Expected status: `400`
- Actual status: `400`
- Result: PASSED

Request body:
```json
{
  "invoiceType": "BILL_OF_SUPPLY"
}
```

Response body:
```json
{
  "success": false,
  "message": "Invoice already exists for this appointment"
}
```

### 38. Update appointment B status to CONFIRMED

- Route: `PATCH /api/appointments/aa27f550-265d-489f-af45-3e5f96c81730/status`
- Auth: Bearer <SALON_ADMIN_ACCESS_TOKEN>
- Expected status: `200`
- Actual status: `200`
- Result: PASSED

Request body:
```json
{
  "status": "CONFIRMED"
}
```

Response body:
```json
{
  "success": true,
  "message": "Appointment status updated successfully",
  "data": {
    "id": "aa27f550-265d-489f-af45-3e5f96c81730",
    "appointmentCode": "APT17815913446911be84ab7",
    "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
    "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
    "customerId": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
    "staffId": "5c1a7d0c-ae75-4b99-aeff-4d4e16587615",
    "startTime": "2030-01-01T12:30:00.000Z",
    "endTime": "2030-01-01T13:30:00.000Z",
    "totalDurationMinutes": 60,
    "estimatedAmount": "500",
    "status": "CONFIRMED",
    "bookingNote": null,
    "internalNote": null,
    "createdAt": "2026-06-16T06:29:04.694Z",
    "updatedAt": "2026-06-16T06:29:04.843Z",
    "customer": {
      "id": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
      "name": "Report Customer A",
      "phone": "9891343990",
      "customerCode": "ABM905781"
    },
    "staff": {
      "id": "5c1a7d0c-ae75-4b99-aeff-4d4e16587615",
      "name": "Report Staff A",
      "jobRole": "Stylist"
    },
    "branch": {
      "id": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
      "name": "Report Branch A 1781591343990"
    },
    "services": [
      {
        "id": "b23773b5-bbbd-4ff1-8591-68186b7ca4b3",
        "appointmentId": "aa27f550-265d-489f-af45-3e5f96c81730",
        "serviceId": "0f5433c4-2702-4b63-9b56-ddcd8d2b1607",
        "serviceName": "Report Haircut 1781591343990",
        "price": "500",
        "durationValue": 60,
        "durationUnit": "MINUTES",
        "createdAt": "2026-06-16T06:29:04.694Z"
      }
    ],
    "statusHistory": []
  }
}
```

### 39. Update appointment B status to CHECKED_IN

- Route: `PATCH /api/appointments/aa27f550-265d-489f-af45-3e5f96c81730/status`
- Auth: Bearer <SALON_ADMIN_ACCESS_TOKEN>
- Expected status: `200`
- Actual status: `200`
- Result: PASSED

Request body:
```json
{
  "status": "CHECKED_IN"
}
```

Response body:
```json
{
  "success": true,
  "message": "Appointment status updated successfully",
  "data": {
    "id": "aa27f550-265d-489f-af45-3e5f96c81730",
    "appointmentCode": "APT17815913446911be84ab7",
    "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
    "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
    "customerId": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
    "staffId": "5c1a7d0c-ae75-4b99-aeff-4d4e16587615",
    "startTime": "2030-01-01T12:30:00.000Z",
    "endTime": "2030-01-01T13:30:00.000Z",
    "totalDurationMinutes": 60,
    "estimatedAmount": "500",
    "status": "CHECKED_IN",
    "bookingNote": null,
    "internalNote": null,
    "createdAt": "2026-06-16T06:29:04.694Z",
    "updatedAt": "2026-06-16T06:29:04.858Z",
    "customer": {
      "id": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
      "name": "Report Customer A",
      "phone": "9891343990",
      "customerCode": "ABM905781"
    },
    "staff": {
      "id": "5c1a7d0c-ae75-4b99-aeff-4d4e16587615",
      "name": "Report Staff A",
      "jobRole": "Stylist"
    },
    "branch": {
      "id": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
      "name": "Report Branch A 1781591343990"
    },
    "services": [
      {
        "id": "b23773b5-bbbd-4ff1-8591-68186b7ca4b3",
        "appointmentId": "aa27f550-265d-489f-af45-3e5f96c81730",
        "serviceId": "0f5433c4-2702-4b63-9b56-ddcd8d2b1607",
        "serviceName": "Report Haircut 1781591343990",
        "price": "500",
        "durationValue": 60,
        "durationUnit": "MINUTES",
        "createdAt": "2026-06-16T06:29:04.694Z"
      }
    ],
    "statusHistory": [
      {
        "id": "5b531a54-7dd2-4545-858c-086117dfb2e4",
        "appointmentId": "aa27f550-265d-489f-af45-3e5f96c81730",
        "oldStatus": "SCHEDULED",
        "newStatus": "CONFIRMED",
        "note": null,
        "changedById": "a231d7b8-05c4-41a3-8ae9-0c888f509489",
        "createdAt": "2026-06-16T06:29:04.848Z"
      }
    ]
  }
}
```

### 40. Update appointment B status to COMPLETED

- Route: `PATCH /api/appointments/aa27f550-265d-489f-af45-3e5f96c81730/status`
- Auth: Bearer <SALON_ADMIN_ACCESS_TOKEN>
- Expected status: `200`
- Actual status: `200`
- Result: PASSED

Request body:
```json
{
  "status": "COMPLETED"
}
```

Response body:
```json
{
  "success": true,
  "message": "Appointment status updated successfully",
  "data": {
    "id": "aa27f550-265d-489f-af45-3e5f96c81730",
    "appointmentCode": "APT17815913446911be84ab7",
    "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
    "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
    "customerId": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
    "staffId": "5c1a7d0c-ae75-4b99-aeff-4d4e16587615",
    "startTime": "2030-01-01T12:30:00.000Z",
    "endTime": "2030-01-01T13:30:00.000Z",
    "totalDurationMinutes": 60,
    "estimatedAmount": "500",
    "status": "COMPLETED",
    "bookingNote": null,
    "internalNote": null,
    "createdAt": "2026-06-16T06:29:04.694Z",
    "updatedAt": "2026-06-16T06:29:04.873Z",
    "customer": {
      "id": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
      "name": "Report Customer A",
      "phone": "9891343990",
      "customerCode": "ABM905781"
    },
    "staff": {
      "id": "5c1a7d0c-ae75-4b99-aeff-4d4e16587615",
      "name": "Report Staff A",
      "jobRole": "Stylist"
    },
    "branch": {
      "id": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
      "name": "Report Branch A 1781591343990"
    },
    "services": [
      {
        "id": "b23773b5-bbbd-4ff1-8591-68186b7ca4b3",
        "appointmentId": "aa27f550-265d-489f-af45-3e5f96c81730",
        "serviceId": "0f5433c4-2702-4b63-9b56-ddcd8d2b1607",
        "serviceName": "Report Haircut 1781591343990",
        "price": "500",
        "durationValue": 60,
        "durationUnit": "MINUTES",
        "createdAt": "2026-06-16T06:29:04.694Z"
      }
    ],
    "statusHistory": [
      {
        "id": "4f6d340f-2fa1-452b-9741-997054707db2",
        "appointmentId": "aa27f550-265d-489f-af45-3e5f96c81730",
        "oldStatus": "CONFIRMED",
        "newStatus": "CHECKED_IN",
        "note": null,
        "changedById": "a231d7b8-05c4-41a3-8ae9-0c888f509489",
        "createdAt": "2026-06-16T06:29:04.863Z"
      },
      {
        "id": "5b531a54-7dd2-4545-858c-086117dfb2e4",
        "appointmentId": "aa27f550-265d-489f-af45-3e5f96c81730",
        "oldStatus": "SCHEDULED",
        "newStatus": "CONFIRMED",
        "note": null,
        "changedById": "a231d7b8-05c4-41a3-8ae9-0c888f509489",
        "createdAt": "2026-06-16T06:29:04.848Z"
      }
    ]
  }
}
```

### 41. Create GST_INVOICE with 18 percent tax

- Route: `POST /api/invoices/from-appointment/aa27f550-265d-489f-af45-3e5f96c81730`
- Auth: Bearer <SALON_ADMIN_ACCESS_TOKEN>
- Expected status: `201`
- Actual status: `201`
- Result: PASSED

Request body:
```json
{
  "invoiceType": "GST_INVOICE",
  "taxPercent": 18
}
```

Response body:
```json
{
  "success": true,
  "message": "Invoice created successfully",
  "data": {
    "id": "e0c0b52e-4554-4ee0-9918-731ebe406548",
    "invoiceCode": "INV1781591344886",
    "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
    "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
    "customerId": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
    "appointmentId": "aa27f550-265d-489f-af45-3e5f96c81730",
    "invoiceType": "GST_INVOICE",
    "invoiceDate": "2026-06-16T06:29:04.890Z",
    "salonName": "Report Salon A 1781591343990",
    "salonPhone": "9876500001",
    "salonEmail": "report-salon-a-1781591343990@example.com",
    "salonAddress": "A Street, Mumbai, MH, 400001",
    "salonGst": null,
    "customerName": "Report Customer A",
    "customerPhone": "9891343990",
    "customerEmail": "report-customer-a-1781591343990@example.com",
    "customerAddress": null,
    "customerGst": "27ABCDE1234F1Z5",
    "subtotalAmount": "500",
    "discountAmount": "0",
    "processingFeeAmount": "0",
    "taxAmount": "90",
    "totalAmount": "590",
    "paidAmount": "0",
    "balanceAmount": "590",
    "status": "ISSUED",
    "paymentStatus": "UNPAID",
    "billingNote": null,
    "footerNote": null,
    "createdAt": "2026-06-16T06:29:04.890Z",
    "updatedAt": "2026-06-16T06:29:04.890Z",
    "salon": {
      "id": "316c156e-1e86-4788-b66d-b7836e1ae722",
      "name": "Report Salon A 1781591343990"
    },
    "branch": {
      "id": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
      "name": "Report Branch A 1781591343990"
    },
    "customer": {
      "id": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
      "name": "Report Customer A",
      "phone": "9891343990",
      "customerCode": "ABM905781"
    },
    "appointment": {
      "id": "aa27f550-265d-489f-af45-3e5f96c81730",
      "appointmentCode": "APT17815913446911be84ab7",
      "status": "COMPLETED"
    },
    "items": [
      {
        "id": "33871b43-321b-4c18-8335-e156ac71caf8",
        "invoiceId": "e0c0b52e-4554-4ee0-9918-731ebe406548",
        "serviceId": "0f5433c4-2702-4b63-9b56-ddcd8d2b1607",
        "itemCode": "0f5433c4",
        "description": "Report Haircut 1781591343990",
        "serviceName": "Report Haircut 1781591343990",
        "quantity": 1,
        "unitPrice": "500",
        "discountAmount": "0",
        "taxPercent": "18",
        "taxAmount": "90",
        "lineTotal": "590",
        "createdAt": "2026-06-16T06:29:04.890Z"
      }
    ],
    "payments": []
  }
}
```

### 42. List invoices

- Route: `GET /api/invoices`
- Auth: Bearer <SALON_ADMIN_ACCESS_TOKEN>
- Expected status: `200`
- Actual status: `200`
- Result: PASSED

Request body:
```json
{}
```

Response body:
```json
{
  "success": true,
  "message": "Invoices fetched successfully",
  "data": [
    {
      "id": "e0c0b52e-4554-4ee0-9918-731ebe406548",
      "invoiceCode": "INV1781591344886",
      "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
      "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
      "customerId": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
      "appointmentId": "aa27f550-265d-489f-af45-3e5f96c81730",
      "invoiceType": "GST_INVOICE",
      "invoiceDate": "2026-06-16T06:29:04.890Z",
      "salonName": "Report Salon A 1781591343990",
      "salonPhone": "9876500001",
      "salonEmail": "report-salon-a-1781591343990@example.com",
      "salonAddress": "A Street, Mumbai, MH, 400001",
      "salonGst": null,
      "customerName": "Report Customer A",
      "customerPhone": "9891343990",
      "customerEmail": "report-customer-a-1781591343990@example.com",
      "customerAddress": null,
      "customerGst": "27ABCDE1234F1Z5",
      "subtotalAmount": "500",
      "discountAmount": "0",
      "processingFeeAmount": "0",
      "taxAmount": "90",
      "totalAmount": "590",
      "paidAmount": "0",
      "balanceAmount": "590",
      "status": "ISSUED",
      "paymentStatus": "UNPAID",
      "billingNote": null,
      "footerNote": null,
      "createdAt": "2026-06-16T06:29:04.890Z",
      "updatedAt": "2026-06-16T06:29:04.890Z",
      "branch": {
        "id": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
        "name": "Report Branch A 1781591343990"
      },
      "customer": {
        "id": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
        "name": "Report Customer A",
        "phone": "9891343990",
        "customerCode": "ABM905781"
      },
      "items": [
        {
          "id": "33871b43-321b-4c18-8335-e156ac71caf8",
          "invoiceId": "e0c0b52e-4554-4ee0-9918-731ebe406548",
          "serviceId": "0f5433c4-2702-4b63-9b56-ddcd8d2b1607",
          "itemCode": "0f5433c4",
          "description": "Report Haircut 1781591343990",
          "serviceName": "Report Haircut 1781591343990",
          "quantity": 1,
          "unitPrice": "500",
          "discountAmount": "0",
          "taxPercent": "18",
          "taxAmount": "90",
          "lineTotal": "590",
          "createdAt": "2026-06-16T06:29:04.890Z"
        }
      ],
      "payments": []
    },
    {
      "id": "d1cf2640-1dc1-45cf-9c7d-29afe6541fcc",
      "invoiceCode": "INV1781591344813",
      "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
      "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
      "customerId": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
      "appointmentId": "bbcefcc3-4b88-4cd8-abc4-bccd7438eec0",
      "invoiceType": "BILL_OF_SUPPLY",
      "invoiceDate": "2026-06-16T06:29:04.817Z",
      "salonName": "Report Salon A 1781591343990",
      "salonPhone": "9876500001",
      "salonEmail": "report-salon-a-1781591343990@example.com",
      "salonAddress": "A Street, Mumbai, MH, 400001",
      "salonGst": null,
      "customerName": "Report Customer A",
      "customerPhone": "9891343990",
      "customerEmail": "report-customer-a-1781591343990@example.com",
      "customerAddress": null,
      "customerGst": "27ABCDE1234F1Z5",
      "subtotalAmount": "500",
      "discountAmount": "0",
      "processingFeeAmount": "0",
      "taxAmount": "0",
      "totalAmount": "500",
      "paidAmount": "0",
      "balanceAmount": "500",
      "status": "ISSUED",
      "paymentStatus": "UNPAID",
      "billingNote": null,
      "footerNote": null,
      "createdAt": "2026-06-16T06:29:04.817Z",
      "updatedAt": "2026-06-16T06:29:04.817Z",
      "branch": {
        "id": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
        "name": "Report Branch A 1781591343990"
      },
      "customer": {
        "id": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
        "name": "Report Customer A",
        "phone": "9891343990",
        "customerCode": "ABM905781"
      },
      "items": [
        {
          "id": "d03cbc23-c417-427e-ae1f-2401cf6c4fed",
          "invoiceId": "d1cf2640-1dc1-45cf-9c7d-29afe6541fcc",
          "serviceId": "0f5433c4-2702-4b63-9b56-ddcd8d2b1607",
          "itemCode": "0f5433c4",
          "description": "Report Haircut 1781591343990",
          "serviceName": "Report Haircut 1781591343990",
          "quantity": 1,
          "unitPrice": "500",
          "discountAmount": "0",
          "taxPercent": "0",
          "taxAmount": "0",
          "lineTotal": "500",
          "createdAt": "2026-06-16T06:29:04.817Z"
        }
      ],
      "payments": []
    }
  ]
}
```

### 43. Get invoice by ID

- Route: `GET /api/invoices/d1cf2640-1dc1-45cf-9c7d-29afe6541fcc`
- Auth: Bearer <SALON_ADMIN_ACCESS_TOKEN>
- Expected status: `200`
- Actual status: `200`
- Result: PASSED

Request body:
```json
{}
```

Response body:
```json
{
  "success": true,
  "message": "Invoice fetched successfully",
  "data": {
    "id": "d1cf2640-1dc1-45cf-9c7d-29afe6541fcc",
    "invoiceCode": "INV1781591344813",
    "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
    "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
    "customerId": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
    "appointmentId": "bbcefcc3-4b88-4cd8-abc4-bccd7438eec0",
    "invoiceType": "BILL_OF_SUPPLY",
    "invoiceDate": "2026-06-16T06:29:04.817Z",
    "salonName": "Report Salon A 1781591343990",
    "salonPhone": "9876500001",
    "salonEmail": "report-salon-a-1781591343990@example.com",
    "salonAddress": "A Street, Mumbai, MH, 400001",
    "salonGst": null,
    "customerName": "Report Customer A",
    "customerPhone": "9891343990",
    "customerEmail": "report-customer-a-1781591343990@example.com",
    "customerAddress": null,
    "customerGst": "27ABCDE1234F1Z5",
    "subtotalAmount": "500",
    "discountAmount": "0",
    "processingFeeAmount": "0",
    "taxAmount": "0",
    "totalAmount": "500",
    "paidAmount": "0",
    "balanceAmount": "500",
    "status": "ISSUED",
    "paymentStatus": "UNPAID",
    "billingNote": null,
    "footerNote": null,
    "createdAt": "2026-06-16T06:29:04.817Z",
    "updatedAt": "2026-06-16T06:29:04.817Z",
    "branch": {
      "id": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
      "name": "Report Branch A 1781591343990"
    },
    "customer": {
      "id": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
      "name": "Report Customer A",
      "phone": "9891343990",
      "email": "report-customer-a-1781591343990@example.com",
      "gst": "27ABCDE1234F1Z5",
      "customerCode": "ABM905781",
      "outstandingAmount": "0",
      "walletBalance": "0"
    },
    "appointment": {
      "id": "bbcefcc3-4b88-4cd8-abc4-bccd7438eec0",
      "appointmentCode": "APT1781591344608fb6de9f8",
      "status": "COMPLETED",
      "startTime": "2030-01-01T10:00:00.000Z",
      "endTime": "2030-01-01T11:00:00.000Z"
    },
    "items": [
      {
        "id": "d03cbc23-c417-427e-ae1f-2401cf6c4fed",
        "invoiceId": "d1cf2640-1dc1-45cf-9c7d-29afe6541fcc",
        "serviceId": "0f5433c4-2702-4b63-9b56-ddcd8d2b1607",
        "itemCode": "0f5433c4",
        "description": "Report Haircut 1781591343990",
        "serviceName": "Report Haircut 1781591343990",
        "quantity": 1,
        "unitPrice": "500",
        "discountAmount": "0",
        "taxPercent": "0",
        "taxAmount": "0",
        "lineTotal": "500",
        "createdAt": "2026-06-16T06:29:04.817Z"
      }
    ],
    "payments": []
  }
}
```

### 44. Record partial payment

- Route: `POST /api/payments`
- Auth: Bearer <SALON_ADMIN_ACCESS_TOKEN>
- Expected status: `201`
- Actual status: `201`
- Result: PASSED

Request body:
```json
{
  "invoiceId": "d1cf2640-1dc1-45cf-9c7d-29afe6541fcc",
  "amount": 200,
  "method": "CASH",
  "referenceNo": "REPORT-PARTIAL"
}
```

Response body:
```json
{
  "success": true,
  "message": "Payment recorded successfully",
  "data": {
    "payment": {
      "id": "024da69e-47e7-4409-9cd1-9c555d8d1e66",
      "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
      "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
      "customerId": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
      "invoiceId": "d1cf2640-1dc1-45cf-9c7d-29afe6541fcc",
      "amount": "200",
      "method": "CASH",
      "referenceNo": "REPORT-PARTIAL",
      "note": null,
      "paidAt": "2026-06-16T06:29:04.937Z",
      "createdAt": "2026-06-16T06:29:04.937Z",
      "updatedAt": "2026-06-16T06:29:04.937Z",
      "salon": {
        "id": "316c156e-1e86-4788-b66d-b7836e1ae722",
        "name": "Report Salon A 1781591343990"
      },
      "branch": {
        "id": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
        "name": "Report Branch A 1781591343990"
      },
      "customer": {
        "id": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
        "name": "Report Customer A",
        "phone": "9891343990",
        "customerCode": "ABM905781"
      },
      "invoice": {
        "id": "d1cf2640-1dc1-45cf-9c7d-29afe6541fcc",
        "invoiceCode": "INV1781591344813",
        "totalAmount": "500",
        "paidAmount": "0",
        "balanceAmount": "500",
        "paymentStatus": "UNPAID"
      }
    },
    "invoice": {
      "id": "d1cf2640-1dc1-45cf-9c7d-29afe6541fcc",
      "invoiceCode": "INV1781591344813",
      "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
      "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
      "customerId": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
      "appointmentId": "bbcefcc3-4b88-4cd8-abc4-bccd7438eec0",
      "invoiceType": "BILL_OF_SUPPLY",
      "invoiceDate": "2026-06-16T06:29:04.817Z",
      "salonName": "Report Salon A 1781591343990",
      "salonPhone": "9876500001",
      "salonEmail": "report-salon-a-1781591343990@example.com",
      "salonAddress": "A Street, Mumbai, MH, 400001",
      "salonGst": null,
      "customerName": "Report Customer A",
      "customerPhone": "9891343990",
      "customerEmail": "report-customer-a-1781591343990@example.com",
      "customerAddress": null,
      "customerGst": "27ABCDE1234F1Z5",
      "subtotalAmount": "500",
      "discountAmount": "0",
      "processingFeeAmount": "0",
      "taxAmount": "0",
      "totalAmount": "500",
      "paidAmount": "200",
      "balanceAmount": "300",
      "status": "ISSUED",
      "paymentStatus": "PARTIALLY_PAID",
      "billingNote": null,
      "footerNote": null,
      "createdAt": "2026-06-16T06:29:04.817Z",
      "updatedAt": "2026-06-16T06:29:04.943Z",
      "items": [
        {
          "id": "d03cbc23-c417-427e-ae1f-2401cf6c4fed",
          "invoiceId": "d1cf2640-1dc1-45cf-9c7d-29afe6541fcc",
          "serviceId": "0f5433c4-2702-4b63-9b56-ddcd8d2b1607",
          "itemCode": "0f5433c4",
          "description": "Report Haircut 1781591343990",
          "serviceName": "Report Haircut 1781591343990",
          "quantity": 1,
          "unitPrice": "500",
          "discountAmount": "0",
          "taxPercent": "0",
          "taxAmount": "0",
          "lineTotal": "500",
          "createdAt": "2026-06-16T06:29:04.817Z"
        }
      ],
      "payments": [
        {
          "id": "024da69e-47e7-4409-9cd1-9c555d8d1e66",
          "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
          "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
          "customerId": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
          "invoiceId": "d1cf2640-1dc1-45cf-9c7d-29afe6541fcc",
          "amount": "200",
          "method": "CASH",
          "referenceNo": "REPORT-PARTIAL",
          "note": null,
          "paidAt": "2026-06-16T06:29:04.937Z",
          "createdAt": "2026-06-16T06:29:04.937Z",
          "updatedAt": "2026-06-16T06:29:04.937Z"
        }
      ]
    }
  }
}
```

### 45. Reject overpayment

- Route: `POST /api/payments`
- Auth: Bearer <SALON_ADMIN_ACCESS_TOKEN>
- Expected status: `400`
- Actual status: `400`
- Result: PASSED

Request body:
```json
{
  "invoiceId": "d1cf2640-1dc1-45cf-9c7d-29afe6541fcc",
  "amount": 301,
  "method": "CASH"
}
```

Response body:
```json
{
  "success": false,
  "message": "Payment amount cannot be greater than invoice balance"
}
```

### 46. Record final payment

- Route: `POST /api/payments`
- Auth: Bearer <SALON_ADMIN_ACCESS_TOKEN>
- Expected status: `201`
- Actual status: `201`
- Result: PASSED

Request body:
```json
{
  "invoiceId": "d1cf2640-1dc1-45cf-9c7d-29afe6541fcc",
  "amount": 300,
  "method": "UPI",
  "referenceNo": "REPORT-FULL"
}
```

Response body:
```json
{
  "success": true,
  "message": "Payment recorded successfully",
  "data": {
    "payment": {
      "id": "b0a3ace6-641c-49b8-b869-6d1a8c68e30c",
      "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
      "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
      "customerId": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
      "invoiceId": "d1cf2640-1dc1-45cf-9c7d-29afe6541fcc",
      "amount": "300",
      "method": "UPI",
      "referenceNo": "REPORT-FULL",
      "note": null,
      "paidAt": "2026-06-16T06:29:04.963Z",
      "createdAt": "2026-06-16T06:29:04.963Z",
      "updatedAt": "2026-06-16T06:29:04.963Z",
      "salon": {
        "id": "316c156e-1e86-4788-b66d-b7836e1ae722",
        "name": "Report Salon A 1781591343990"
      },
      "branch": {
        "id": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
        "name": "Report Branch A 1781591343990"
      },
      "customer": {
        "id": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
        "name": "Report Customer A",
        "phone": "9891343990",
        "customerCode": "ABM905781"
      },
      "invoice": {
        "id": "d1cf2640-1dc1-45cf-9c7d-29afe6541fcc",
        "invoiceCode": "INV1781591344813",
        "totalAmount": "500",
        "paidAmount": "200",
        "balanceAmount": "300",
        "paymentStatus": "PARTIALLY_PAID"
      }
    },
    "invoice": {
      "id": "d1cf2640-1dc1-45cf-9c7d-29afe6541fcc",
      "invoiceCode": "INV1781591344813",
      "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
      "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
      "customerId": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
      "appointmentId": "bbcefcc3-4b88-4cd8-abc4-bccd7438eec0",
      "invoiceType": "BILL_OF_SUPPLY",
      "invoiceDate": "2026-06-16T06:29:04.817Z",
      "salonName": "Report Salon A 1781591343990",
      "salonPhone": "9876500001",
      "salonEmail": "report-salon-a-1781591343990@example.com",
      "salonAddress": "A Street, Mumbai, MH, 400001",
      "salonGst": null,
      "customerName": "Report Customer A",
      "customerPhone": "9891343990",
      "customerEmail": "report-customer-a-1781591343990@example.com",
      "customerAddress": null,
      "customerGst": "27ABCDE1234F1Z5",
      "subtotalAmount": "500",
      "discountAmount": "0",
      "processingFeeAmount": "0",
      "taxAmount": "0",
      "totalAmount": "500",
      "paidAmount": "500",
      "balanceAmount": "0",
      "status": "ISSUED",
      "paymentStatus": "PAID",
      "billingNote": null,
      "footerNote": null,
      "createdAt": "2026-06-16T06:29:04.817Z",
      "updatedAt": "2026-06-16T06:29:04.969Z",
      "items": [
        {
          "id": "d03cbc23-c417-427e-ae1f-2401cf6c4fed",
          "invoiceId": "d1cf2640-1dc1-45cf-9c7d-29afe6541fcc",
          "serviceId": "0f5433c4-2702-4b63-9b56-ddcd8d2b1607",
          "itemCode": "0f5433c4",
          "description": "Report Haircut 1781591343990",
          "serviceName": "Report Haircut 1781591343990",
          "quantity": 1,
          "unitPrice": "500",
          "discountAmount": "0",
          "taxPercent": "0",
          "taxAmount": "0",
          "lineTotal": "500",
          "createdAt": "2026-06-16T06:29:04.817Z"
        }
      ],
      "payments": [
        {
          "id": "024da69e-47e7-4409-9cd1-9c555d8d1e66",
          "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
          "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
          "customerId": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
          "invoiceId": "d1cf2640-1dc1-45cf-9c7d-29afe6541fcc",
          "amount": "200",
          "method": "CASH",
          "referenceNo": "REPORT-PARTIAL",
          "note": null,
          "paidAt": "2026-06-16T06:29:04.937Z",
          "createdAt": "2026-06-16T06:29:04.937Z",
          "updatedAt": "2026-06-16T06:29:04.937Z"
        },
        {
          "id": "b0a3ace6-641c-49b8-b869-6d1a8c68e30c",
          "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
          "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
          "customerId": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
          "invoiceId": "d1cf2640-1dc1-45cf-9c7d-29afe6541fcc",
          "amount": "300",
          "method": "UPI",
          "referenceNo": "REPORT-FULL",
          "note": null,
          "paidAt": "2026-06-16T06:29:04.963Z",
          "createdAt": "2026-06-16T06:29:04.963Z",
          "updatedAt": "2026-06-16T06:29:04.963Z"
        }
      ]
    }
  }
}
```

### 47. List payments

- Route: `GET /api/payments`
- Auth: Bearer <SALON_ADMIN_ACCESS_TOKEN>
- Expected status: `200`
- Actual status: `200`
- Result: PASSED

Request body:
```json
{}
```

Response body:
```json
{
  "success": true,
  "message": "Payments fetched successfully",
  "data": [
    {
      "id": "b0a3ace6-641c-49b8-b869-6d1a8c68e30c",
      "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
      "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
      "customerId": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
      "invoiceId": "d1cf2640-1dc1-45cf-9c7d-29afe6541fcc",
      "amount": "300",
      "method": "UPI",
      "referenceNo": "REPORT-FULL",
      "note": null,
      "paidAt": "2026-06-16T06:29:04.963Z",
      "createdAt": "2026-06-16T06:29:04.963Z",
      "updatedAt": "2026-06-16T06:29:04.963Z",
      "branch": {
        "id": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
        "name": "Report Branch A 1781591343990"
      },
      "customer": {
        "id": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
        "name": "Report Customer A",
        "phone": "9891343990",
        "customerCode": "ABM905781"
      },
      "invoice": {
        "id": "d1cf2640-1dc1-45cf-9c7d-29afe6541fcc",
        "invoiceCode": "INV1781591344813",
        "totalAmount": "500",
        "paidAmount": "500",
        "balanceAmount": "0",
        "paymentStatus": "PAID"
      }
    },
    {
      "id": "024da69e-47e7-4409-9cd1-9c555d8d1e66",
      "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
      "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
      "customerId": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
      "invoiceId": "d1cf2640-1dc1-45cf-9c7d-29afe6541fcc",
      "amount": "200",
      "method": "CASH",
      "referenceNo": "REPORT-PARTIAL",
      "note": null,
      "paidAt": "2026-06-16T06:29:04.937Z",
      "createdAt": "2026-06-16T06:29:04.937Z",
      "updatedAt": "2026-06-16T06:29:04.937Z",
      "branch": {
        "id": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
        "name": "Report Branch A 1781591343990"
      },
      "customer": {
        "id": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
        "name": "Report Customer A",
        "phone": "9891343990",
        "customerCode": "ABM905781"
      },
      "invoice": {
        "id": "d1cf2640-1dc1-45cf-9c7d-29afe6541fcc",
        "invoiceCode": "INV1781591344813",
        "totalAmount": "500",
        "paidAmount": "500",
        "balanceAmount": "0",
        "paymentStatus": "PAID"
      }
    }
  ]
}
```

### 48. Get payment by ID

- Route: `GET /api/payments/024da69e-47e7-4409-9cd1-9c555d8d1e66`
- Auth: Bearer <SALON_ADMIN_ACCESS_TOKEN>
- Expected status: `200`
- Actual status: `200`
- Result: PASSED

Request body:
```json
{}
```

Response body:
```json
{
  "success": true,
  "message": "Payment fetched successfully",
  "data": {
    "id": "024da69e-47e7-4409-9cd1-9c555d8d1e66",
    "salonId": "316c156e-1e86-4788-b66d-b7836e1ae722",
    "branchId": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
    "customerId": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
    "invoiceId": "d1cf2640-1dc1-45cf-9c7d-29afe6541fcc",
    "amount": "200",
    "method": "CASH",
    "referenceNo": "REPORT-PARTIAL",
    "note": null,
    "paidAt": "2026-06-16T06:29:04.937Z",
    "createdAt": "2026-06-16T06:29:04.937Z",
    "updatedAt": "2026-06-16T06:29:04.937Z",
    "branch": {
      "id": "0fe95e32-71db-4ecc-a018-5342ccdbae0b",
      "name": "Report Branch A 1781591343990"
    },
    "customer": {
      "id": "a7cb2e0c-3d72-44a0-84b4-8145f74d0cc7",
      "name": "Report Customer A",
      "phone": "9891343990",
      "customerCode": "ABM905781"
    },
    "invoice": {
      "id": "d1cf2640-1dc1-45cf-9c7d-29afe6541fcc",
      "invoiceCode": "INV1781591344813",
      "totalAmount": "500",
      "paidAmount": "500",
      "balanceAmount": "0",
      "paymentStatus": "PAID"
    }
  }
}
```

### 49. Create Salon B

- Route: `POST /api/salons`
- Auth: Bearer <SUPER_ADMIN_ACCESS_TOKEN>
- Expected status: `201`
- Actual status: `201`
- Result: PASSED

Request body:
```json
{
  "name": "Report Salon B 1781591343990"
}
```

Response body:
```json
{
  "success": true,
  "message": "Salon created successfully",
  "data": {
    "id": "b167ee81-cf0e-4b2f-8515-6c1183a9f81f",
    "name": "Report Salon B 1781591343990",
    "addressLine1": null,
    "addressLine2": null,
    "city": null,
    "state": null,
    "country": null,
    "postalCode": null,
    "phone": null,
    "email": null,
    "createdAt": "2026-06-16T06:29:04.990Z",
    "updatedAt": "2026-06-16T06:29:04.990Z"
  }
}
```

### 50. Create Branch B

- Route: `POST /api/branches`
- Auth: Bearer <SUPER_ADMIN_ACCESS_TOKEN>
- Expected status: `201`
- Actual status: `201`
- Result: PASSED

Request body:
```json
{
  "name": "Report Branch B 1781591343990",
  "salonId": "b167ee81-cf0e-4b2f-8515-6c1183a9f81f"
}
```

Response body:
```json
{
  "success": true,
  "message": "Branch created successfully",
  "data": {
    "id": "9cbcd305-4c06-41d9-8845-dffe79b9ea35",
    "name": "Report Branch B 1781591343990",
    "salonId": "b167ee81-cf0e-4b2f-8515-6c1183a9f81f",
    "addressLine1": null,
    "city": null,
    "state": null,
    "postalCode": null,
    "phone": null,
    "createdAt": "2026-06-16T06:29:04.997Z",
    "updatedAt": "2026-06-16T06:29:04.997Z"
  }
}
```

### 51. Create Staff B

- Route: `POST /api/staff`
- Auth: Bearer <SUPER_ADMIN_ACCESS_TOKEN>
- Expected status: `201`
- Actual status: `201`
- Result: PASSED

Request body:
```json
{
  "name": "Report Staff B",
  "email": "report-staff-b-1781591343990@example.com",
  "jobRole": "Stylist",
  "workingFrom": "10:00",
  "workingTo": "19:00",
  "weekOff": "TUESDAY",
  "salonId": "b167ee81-cf0e-4b2f-8515-6c1183a9f81f",
  "branchId": "9cbcd305-4c06-41d9-8845-dffe79b9ea35"
}
```

Response body:
```json
{
  "success": true,
  "message": "Staff created successfully",
  "data": {
    "id": "93fd2720-8c71-4f40-b85e-8e2386453bc8",
    "name": "Report Staff B",
    "email": "report-staff-b-1781591343990@example.com",
    "phone": null,
    "jobRole": "Stylist",
    "workingFrom": "10:00",
    "workingTo": "19:00",
    "weekOff": "TUESDAY",
    "status": true,
    "salonId": "b167ee81-cf0e-4b2f-8515-6c1183a9f81f",
    "userId": null,
    "reportingManagerId": null,
    "createdAt": "2026-06-16T06:29:05.005Z",
    "updatedAt": "2026-06-16T06:29:05.005Z",
    "branchId": "9cbcd305-4c06-41d9-8845-dffe79b9ea35",
    "branch": {
      "id": "9cbcd305-4c06-41d9-8845-dffe79b9ea35",
      "name": "Report Branch B 1781591343990"
    },
    "reportingManager": null
  }
}
```

### 52. Create Customer B

- Route: `POST /api/customers`
- Auth: Bearer <SUPER_ADMIN_ACCESS_TOKEN>
- Expected status: `201`
- Actual status: `201`
- Result: PASSED

Request body:
```json
{
  "name": "Report Customer B",
  "phone": "9791343990",
  "salonId": "b167ee81-cf0e-4b2f-8515-6c1183a9f81f",
  "branchId": "9cbcd305-4c06-41d9-8845-dffe79b9ea35"
}
```

Response body:
```json
{
  "success": true,
  "message": "Customer created successfully",
  "data": {
    "id": "4905b8b1-0de3-414e-aebe-5a775276164f",
    "customerCode": "ABM962349",
    "name": "Report Customer B",
    "phone": "9791343990",
    "email": null,
    "gst": null,
    "customNotes": null,
    "dob": null,
    "anniversaryDate": null,
    "status": "REGULAR",
    "outstandingAmount": "0",
    "walletBalance": "0",
    "salonId": "b167ee81-cf0e-4b2f-8515-6c1183a9f81f",
    "branchId": "9cbcd305-4c06-41d9-8845-dffe79b9ea35",
    "createdAt": "2026-06-16T06:29:05.017Z",
    "updatedAt": "2026-06-16T06:29:05.017Z",
    "salon": {
      "id": "b167ee81-cf0e-4b2f-8515-6c1183a9f81f",
      "name": "Report Salon B 1781591343990"
    },
    "branch": {
      "id": "9cbcd305-4c06-41d9-8845-dffe79b9ea35",
      "name": "Report Branch B 1781591343990"
    }
  }
}
```

### 53. Create Main Service B

- Route: `POST /api/main-services`
- Auth: Bearer <SUPER_ADMIN_ACCESS_TOKEN>
- Expected status: `201`
- Actual status: `201`
- Result: PASSED

Request body:
```json
{
  "name": "Report Skin 1781591343990",
  "salonId": "b167ee81-cf0e-4b2f-8515-6c1183a9f81f"
}
```

Response body:
```json
{
  "success": true,
  "message": "Main service created successfully",
  "data": {
    "id": "692490d0-2994-48e7-95b2-f0dc1df6d350",
    "name": "Report Skin 1781591343990",
    "status": true,
    "salonId": "b167ee81-cf0e-4b2f-8515-6c1183a9f81f",
    "createdAt": "2026-06-16T06:29:05.026Z",
    "updatedAt": "2026-06-16T06:29:05.026Z",
    "salon": {
      "id": "b167ee81-cf0e-4b2f-8515-6c1183a9f81f",
      "name": "Report Salon B 1781591343990"
    }
  }
}
```

### 54. Create Service B

- Route: `POST /api/services`
- Auth: Bearer <SUPER_ADMIN_ACCESS_TOKEN>
- Expected status: `201`
- Actual status: `201`
- Result: PASSED

Request body:
```json
{
  "name": "Report Facial 1781591343990",
  "price": 700,
  "durationValue": 30,
  "durationUnit": "MINUTES",
  "salonId": "b167ee81-cf0e-4b2f-8515-6c1183a9f81f",
  "branchId": "9cbcd305-4c06-41d9-8845-dffe79b9ea35",
  "mainServiceId": "692490d0-2994-48e7-95b2-f0dc1df6d350"
}
```

Response body:
```json
{
  "success": true,
  "message": "Service created successfully",
  "data": {
    "id": "20391d16-19d2-4a9a-8093-82cd03812ca1",
    "name": "Report Facial 1781591343990",
    "description": null,
    "price": "700",
    "durationValue": 30,
    "durationUnit": "MINUTES",
    "status": true,
    "salonId": "b167ee81-cf0e-4b2f-8515-6c1183a9f81f",
    "branchId": "9cbcd305-4c06-41d9-8845-dffe79b9ea35",
    "mainServiceId": "692490d0-2994-48e7-95b2-f0dc1df6d350",
    "createdAt": "2026-06-16T06:29:05.039Z",
    "updatedAt": "2026-06-16T06:29:05.039Z",
    "salon": {
      "id": "b167ee81-cf0e-4b2f-8515-6c1183a9f81f",
      "name": "Report Salon B 1781591343990"
    },
    "branch": {
      "id": "9cbcd305-4c06-41d9-8845-dffe79b9ea35",
      "name": "Report Branch B 1781591343990"
    },
    "mainService": {
      "id": "692490d0-2994-48e7-95b2-f0dc1df6d350",
      "name": "Report Skin 1781591343990"
    }
  }
}
```

### 55. Reject Salon A admin appointment using Salon B resources

- Route: `POST /api/appointments`
- Auth: Bearer <SALON_ADMIN_ACCESS_TOKEN>
- Expected status: `400`
- Actual status: `400`
- Result: PASSED

Request body:
```json
{
  "branchId": "9cbcd305-4c06-41d9-8845-dffe79b9ea35",
  "customerId": "4905b8b1-0de3-414e-aebe-5a775276164f",
  "staffId": "93fd2720-8c71-4f40-b85e-8e2386453bc8",
  "serviceIds": [
    "20391d16-19d2-4a9a-8093-82cd03812ca1"
  ],
  "startTime": "2030-01-02T10:00:00.000Z"
}
```

Response body:
```json
{
  "success": false,
  "message": "Invalid customer for this salon"
}
```
