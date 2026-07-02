import { type Request, type Response } from "express";
import { CustomerModel } from "./customer.model.js";
import { BranchModel } from "../branches/branch.model.js";

const CUSTOMER_STATUSES = ["REGULAR", "PREMIUM", "IRREGULAR"] as const;

type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

const isValidCustomerStatus = (status: string): status is CustomerStatus => {
  return CUSTOMER_STATUSES.includes(status as CustomerStatus);
};

const generateCustomerCode = () => {
  return `ABM${Math.floor(100000 + Math.random() * 900000)}`;
};

const generateUniqueCustomerCode = async (salonId: string) => {
  let customerCode = generateCustomerCode();

  let existingCode = await CustomerModel.findByCustomerCodeAndSalon(
    customerCode,
    salonId
  );

  while (existingCode) {
    customerCode = generateCustomerCode();

    existingCode = await CustomerModel.findByCustomerCodeAndSalon(
      customerCode,
      salonId
    );
  }

  return customerCode;
};

const getFinalSalonId = (req: Request, bodySalonId?: string) => {
  if (req.user?.role === "SUPER_ADMIN") {
    return bodySalonId;
  }

  return req.user?.salonId;
};

const getCustomerIdParam = (req: Request) => {
  const { id } = req.params;
  return typeof id === "string" ? id : null;
};

const getExistingCustomerByAccess = async (req: Request, customerId: string) => {
  if (req.user?.role === "SUPER_ADMIN") {
    return CustomerModel.findById(customerId);
  }

  const salonId = req.user?.salonId;

  if (!salonId) {
    return null;
  }

  return CustomerModel.findByIdAndSalon(
    customerId,
    salonId,
    req.user?.role === "RECEPTIONIST" ? req.user.branchId : undefined
  );
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const {
      name,
      phone,
      email,
      gst,
      customNotes,
      dateOfBirth,
      anniversaryDate,
      status,
      salonId,
      branchId,
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name and phone are required",
      });
    }

    const finalSalonId = getFinalSalonId(req, salonId);

    if (!finalSalonId) {
      return res.status(400).json({
        success: false,
        message: "Salon ID is required",
      });
    }

    const existingCustomer = await CustomerModel.findByPhoneAndSalon(
      phone,
      finalSalonId
    );

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: "Customer with this phone already exists in this salon",
      });
    }

    if (email && (await CustomerModel.findByEmailAndSalon(email, finalSalonId))) {
      return res.status(400).json({
        success: false,
        message: "Customer with this email already exists in this salon",
      });
    }

    if (status && !isValidCustomerStatus(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer status",
      });
    }

    let finalBranchId: string | undefined = branchId;

    if (req.user?.role === "RECEPTIONIST" && req.user.branchId) {
      if (branchId && branchId !== req.user.branchId) {
        return res.status(403).json({
          success: false,
          message: "You do not have access to this branch",
        });
      }

      finalBranchId = req.user.branchId;
    }

    if (finalBranchId) {
      const branch = await BranchModel.findByIdAndSalon(
        finalBranchId,
        finalSalonId
      );

      if (!branch) {
        return res.status(400).json({
          success: false,
          message: "Invalid branch for this salon",
        });
      }
    }

    const customerCode = await generateUniqueCustomerCode(finalSalonId);

    const customerData: Parameters<typeof CustomerModel.create>[0] = {
      customerCode,
      name,
      phone,
      salonId: finalSalonId,
      ...(email ? { email } : {}),
      ...(gst ? { gst } : {}),
      ...(customNotes ? { customNotes } : {}),
      ...(dateOfBirth ? { dob: new Date(dateOfBirth) } : {}),
      ...(anniversaryDate
        ? { anniversaryDate: new Date(anniversaryDate) }
        : {}),
      ...(status ? { status } : {}),
      ...(finalBranchId ? { branchId: finalBranchId } : {}),
    };

    const customer = await CustomerModel.create(customerData);

    return res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: customer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getCustomers = async (req: Request, res: Response) => {
  try {
    if (req.user?.role === "SUPER_ADMIN") {
      const customers = await CustomerModel.findAll();

      return res.status(200).json({
        success: true,
        message: "Customers fetched successfully",
        data: customers,
      });
    }

    if (!req.user?.salonId) {
      return res.status(400).json({
        success: false,
        message: "Salon ID is missing",
      });
    }

    const customers = await CustomerModel.findBySalon(
      req.user.salonId,
      req.user.role === "RECEPTIONIST" ? req.user.branchId : undefined
    );

    return res.status(200).json({
      success: true,
      message: "Customers fetched successfully",
      data: customers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const id = getCustomerIdParam(req);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    if (req.user?.role !== "SUPER_ADMIN" && !req.user?.salonId) {
      return res.status(400).json({
        success: false,
        message: "Salon ID is missing",
      });
    }

    const customer = await getExistingCustomerByAccess(req, id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer fetched successfully",
      data: customer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const id = getCustomerIdParam(req);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    const existingCustomer = await getExistingCustomerByAccess(req, id);

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const finalSalonId = existingCustomer.salonId;

    const {
      branchId,
      dateOfBirth,
      anniversaryDate,
      status,
    } = req.body;

    if (status && !isValidCustomerStatus(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer status",
      });
    }

    if (
      req.user?.role === "RECEPTIONIST" &&
      req.user.branchId &&
      "branchId" in req.body &&
      branchId !== req.user.branchId
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this branch",
      });
    }

    if (branchId) {
      const branch = await BranchModel.findByIdAndSalon(branchId, finalSalonId);

      if (!branch) {
        return res.status(400).json({
          success: false,
          message: "Invalid branch for this salon",
        });
      }
    }

    const updateData: Parameters<typeof CustomerModel.update>[1] = {
      ...(req.body.name ? { name: req.body.name } : {}),
      ...(req.body.phone ? { phone: req.body.phone } : {}),

      ...("email" in req.body ? { email: req.body.email ?? null } : {}),
      ...("gst" in req.body ? { gst: req.body.gst ?? null } : {}),
      ...("customNotes" in req.body
        ? { customNotes: req.body.customNotes ?? null }
        : {}),
      ...("branchId" in req.body ? { branchId: req.body.branchId ?? null } : {}),

      ...("dateOfBirth" in req.body
        ? {
            dob: dateOfBirth ? new Date(dateOfBirth) : null,
          }
        : {}),

      ...("anniversaryDate" in req.body
        ? {
            anniversaryDate: anniversaryDate
              ? new Date(anniversaryDate)
              : null,
          }
        : {}),

      ...(status ? { status } : {}),
    };

    const updatedCustomer = await CustomerModel.update(id, updateData);

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: updatedCustomer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const id = getCustomerIdParam(req);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    const existingCustomer = await getExistingCustomerByAccess(req, id);

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (existingCustomer.transactions.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Customer has transactions and cannot be deleted",
      });
    }

    await CustomerModel.delete(id);

    return res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2003"
    ) {
      return res.status(409).json({
        success: false,
        message: "Customer has transactions and cannot be deleted",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getCustomerTransactions = async (
  req: Request,
  res: Response
) => {
  try {
    const id = getCustomerIdParam(req);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    const existingCustomer = await getExistingCustomerByAccess(req, id);

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const transactions = await CustomerModel.findTransactions(
      existingCustomer.id,
      existingCustomer.salonId
    );

    return res.status(200).json({
      success: true,
      message: "Customer transactions fetched successfully",
      data: transactions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const addCustomerWalletAmount = async (
  req: Request,
  res: Response
) => {
  try {
    const id = getCustomerIdParam(req);
    const { amount, narration } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required",
      });
    }

    const existingCustomer = await getExistingCustomerByAccess(req, id);

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const numericAmount = Number(amount);

    const updatedCustomer = await CustomerModel.addWalletAmount(
      existingCustomer.id,
      numericAmount
    );

    const transaction = await CustomerModel.createTransaction({
      customerId: existingCustomer.id,
      salonId: existingCustomer.salonId,
      narration: narration || `Money added to wallet ${numericAmount}`,
      debit: 0,
      credit: numericAmount,
      status: "COMPLETE",
    });

    return res.status(200).json({
      success: true,
      message: "Wallet amount added successfully",
      data: {
        customer: updatedCustomer,
        transaction,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
