import { type Request, type Response } from "express";
import { CustomerModel } from "./customer.model.js";
import { BranchModel } from "../branches/branch.model.js";

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

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const {
      name,
      phone,
      email,
      gender,
      dateOfBirth,
      notes,
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

    if (branchId) {
      const branch = await BranchModel.findByIdAndSalon(branchId, finalSalonId);

      if (!branch) {
        return res.status(400).json({
          success: false,
          message: "Invalid branch for this salon",
        });
      }
    }

    const customerData: Parameters<typeof CustomerModel.create>[0] = {
      name,
      phone,
      salonId: finalSalonId,
      ...(email ? { email } : {}),
      ...(gender ? { gender } : {}),
      ...(dateOfBirth ? { dateOfBirth: new Date(dateOfBirth) } : {}),
      ...(notes ? { notes } : {}),
      ...(branchId ? { branchId } : {}),
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

    const customers = await CustomerModel.findBySalon(req.user.salonId);

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

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const id = getCustomerIdParam(req);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    let existingCustomer;

    if (req.user?.role === "SUPER_ADMIN") {
      existingCustomer = await CustomerModel.findById(id);
    } else {
      const salonId = req.user?.salonId;

      if (!salonId) {
        return res.status(400).json({
          success: false,
          message: "Salon ID is missing",
        });
      }

      existingCustomer = await CustomerModel.findByIdAndSalon(id, salonId);
    }

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const finalSalonId = existingCustomer.salonId;
    const { branchId, dateOfBirth } = req.body;

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
      ...("gender" in req.body ? { gender: req.body.gender ?? null } : {}),
      ...(dateOfBirth ? { dateOfBirth: new Date(dateOfBirth) } : {}),
      ...("notes" in req.body ? { notes: req.body.notes ?? null } : {}),
      ...("branchId" in req.body ? { branchId: req.body.branchId ?? null } : {}),
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

    let customer;

    if (req.user?.role === "SUPER_ADMIN") {
      customer = await CustomerModel.findById(id);
    } else {
      const salonId = req.user?.salonId;

      if (!salonId) {
        return res.status(400).json({
          success: false,
          message: "Salon ID is missing",
        });
      }

      customer = await CustomerModel.findByIdAndSalon(id, salonId);
    }

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

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const id = getCustomerIdParam(req);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    let existingCustomer;

    if (req.user?.role === "SUPER_ADMIN") {
      existingCustomer = await CustomerModel.findById(id);
    } else {
      const salonId = req.user?.salonId;

      if (!salonId) {
        return res.status(400).json({
          success: false,
          message: "Salon ID is missing",
        });
      }

      existingCustomer = await CustomerModel.findByIdAndSalon(id, salonId);
    }

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    await CustomerModel.delete(id);

    return res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
