import { type Request, type Response } from "express";
import { cleanText } from "../products/inventory-access.js";
import {
  adjustLoyaltyPoints,
  findLoyaltyCustomer,
  getLoyaltyTransactions,
} from "./loyalty.service.js";

const customerIdParam = (req: Request) =>
  typeof req.params.customerId === "string" ? req.params.customerId : "";

const customerAccess = (req: Request) => ({
  salonId:
    req.user?.role === "SUPER_ADMIN" ? undefined : req.user?.salonId,
  branchId:
    req.user?.role === "RECEPTIONIST" ? req.user.branchId : undefined,
});

const sendError = (res: Response, error: unknown) => {
  const status =
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
      ? error.status
      : 500;
  const message =
    error instanceof Error && status !== 500
      ? error.message
      : "Internal server error";

  return res.status(status).json({
    success: false,
    message,
  });
};

export const getCustomerLoyaltyTransactions = async (
  req: Request,
  res: Response
) => {
  try {
    const customerId = customerIdParam(req);
    const access = customerAccess(req);
    const customer = await findLoyaltyCustomer(
      customerId,
      access.salonId,
      access.branchId
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const transactions = await getLoyaltyTransactions(
      customer.id,
      customer.salonId
    );

    return res.status(200).json({
      success: true,
      message: "Loyalty transactions fetched successfully",
      data: {
        customer,
        transactions,
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const adjustCustomerLoyaltyPoints = async (
  req: Request,
  res: Response
) => {
  try {
    const points = Number(req.body.points);

    if (
      !Number.isInteger(points) ||
      points === 0 ||
      typeof req.body.points === "boolean" ||
      req.body.points === null ||
      req.body.points === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Points must be a non-zero integer",
      });
    }

    const customerId = customerIdParam(req);
    const access = customerAccess(req);
    const customer = await findLoyaltyCustomer(
      customerId,
      access.salonId,
      access.branchId
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const note = cleanText(req.body.note);
    const data = await adjustLoyaltyPoints({
      customerId: customer.id,
      salonId: customer.salonId,
      points,
      createdById: req.user.userId,
      ...(note ? { note } : {}),
    });

    return res.status(200).json({
      success: true,
      message: "Loyalty points adjusted successfully",
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
};
