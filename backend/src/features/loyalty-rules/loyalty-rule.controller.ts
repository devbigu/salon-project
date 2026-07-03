import { type Request, type Response } from "express";
import { getSalonId } from "../products/inventory-access.js";
import { LoyaltyRuleModel } from "./loyalty-rule.model.js";
import {
  createLoyaltyRule,
  type LoyaltyRuleValues,
  updateLoyaltyRule,
  updateLoyaltyRuleStatus,
} from "./loyalty-rule.service.js";

const idParam = (req: Request) =>
  typeof req.params.id === "string" ? req.params.id : "";

const accessSalonId = (req: Request) =>
  req.user?.role === "SUPER_ADMIN" ? undefined : req.user?.salonId;

const listSalonId = (req: Request) =>
  req.user?.role === "SUPER_ADMIN"
    ? typeof req.query.salonId === "string"
      ? req.query.salonId
      : undefined
    : req.user?.salonId;

const numericValue = (value: unknown) => {
  if (
    (typeof value !== "number" && typeof value !== "string") ||
    (typeof value === "string" && !value.trim())
  ) {
    return null;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const integerValue = (value: unknown) => {
  const numeric = numericValue(value);
  return numeric !== null && Number.isInteger(numeric) ? numeric : null;
};

const hasField = (body: unknown, field: string) =>
  typeof body === "object" &&
  body !== null &&
  Object.prototype.hasOwnProperty.call(body, field);

const ruleValues = (
  body: Request["body"],
  existing?: {
    earnPointsPerAmount: unknown;
    earnAmountStep: unknown;
    redeemValuePerPoint: unknown;
    minRedeemPoints: number;
    maxRedeemPoints: number | null;
  }
): { data: LoyaltyRuleValues } | { error: string } => {
  const earnPointsPerAmount = hasField(body, "earnPointsPerAmount")
    ? numericValue(body.earnPointsPerAmount)
    : existing
      ? Number(existing.earnPointsPerAmount)
      : 1;
  const earnAmountStep = hasField(body, "earnAmountStep")
    ? numericValue(body.earnAmountStep)
    : existing
      ? Number(existing.earnAmountStep)
      : 100;
  const redeemValuePerPoint = hasField(body, "redeemValuePerPoint")
    ? numericValue(body.redeemValuePerPoint)
    : existing
      ? Number(existing.redeemValuePerPoint)
      : 1;
  const minRedeemPoints = hasField(body, "minRedeemPoints")
    ? integerValue(body.minRedeemPoints)
    : existing
      ? existing.minRedeemPoints
      : 0;
  const maxRedeemPoints = hasField(body, "maxRedeemPoints")
    ? body.maxRedeemPoints === null
      ? null
      : integerValue(body.maxRedeemPoints)
    : existing
      ? existing.maxRedeemPoints
      : null;

  if (earnAmountStep === null || earnAmountStep <= 0) {
    return {
      error: "Earn amount step must be greater than 0",
    };
  }

  if (earnPointsPerAmount === null || earnPointsPerAmount < 0) {
    return {
      error: "Earn points per amount must be at least 0",
    };
  }

  if (redeemValuePerPoint === null || redeemValuePerPoint < 0) {
    return {
      error: "Redeem value per point must be at least 0",
    };
  }

  if (minRedeemPoints === null || minRedeemPoints < 0) {
    return {
      error: "Minimum redeem points must be a non-negative integer",
    };
  }

  if (
    maxRedeemPoints !== null &&
    (maxRedeemPoints < 0 || maxRedeemPoints < minRedeemPoints)
  ) {
    return {
      error:
        "Maximum redeem points must be null or greater than or equal to minimum redeem points",
    };
  }

  return {
    data: {
      earnPointsPerAmount,
      earnAmountStep,
      redeemValuePerPoint,
      minRedeemPoints,
      maxRedeemPoints,
    },
  };
};

const sendError = (res: Response, error: unknown) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2034"
  ) {
    return res.status(409).json({
      success: false,
      message: "Loyalty rule changed concurrently; please retry",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};

export const createRule = async (req: Request, res: Response) => {
  try {
    const salonId = getSalonId(req, req.body.salonId);

    if (!salonId) {
      return res.status(400).json({
        success: false,
        message: "Salon ID is required",
      });
    }

    if (!(await LoyaltyRuleModel.salonExists(salonId))) {
      return res.status(400).json({
        success: false,
        message: "Invalid salon",
      });
    }

    if (
      req.body.status !== undefined &&
      typeof req.body.status !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message: "Status must be true or false",
      });
    }

    const parsed = ruleValues(req.body);

    if ("error" in parsed) {
      return res.status(400).json({
        success: false,
        message: parsed.error,
      });
    }

    const data = await createLoyaltyRule(
      salonId,
      parsed.data,
      req.body.status ?? true
    );

    return res.status(201).json({
      success: true,
      message: "Loyalty rule created successfully",
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const getRules = async (req: Request, res: Response) => {
  try {
    const salonId = listSalonId(req);

    if (req.user?.role !== "SUPER_ADMIN" && !salonId) {
      return res.status(400).json({
        success: false,
        message: "Salon ID is missing",
      });
    }

    const data = await LoyaltyRuleModel.list(salonId);
    return res.status(200).json({
      success: true,
      message: "Loyalty rules fetched successfully",
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const getActiveRule = async (req: Request, res: Response) => {
  try {
    const salonId = listSalonId(req);

    if (!salonId) {
      return res.status(400).json({
        success: false,
        message: "Salon ID is required",
      });
    }

    const data = await LoyaltyRuleModel.findActive(salonId);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Active loyalty rule not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Active loyalty rule fetched successfully",
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const getRule = async (req: Request, res: Response) => {
  try {
    const data = await LoyaltyRuleModel.find(
      idParam(req),
      accessSalonId(req)
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Loyalty rule not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Loyalty rule fetched successfully",
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const updateRule = async (req: Request, res: Response) => {
  try {
    const existing = await LoyaltyRuleModel.find(
      idParam(req),
      accessSalonId(req)
    );

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Loyalty rule not found",
      });
    }

    const parsed = ruleValues(req.body, existing);

    if ("error" in parsed) {
      return res.status(400).json({
        success: false,
        message: parsed.error,
      });
    }

    const data = await updateLoyaltyRule(existing.id, parsed.data);
    return res.status(200).json({
      success: true,
      message: "Loyalty rule updated successfully",
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const setRuleStatus = async (req: Request, res: Response) => {
  try {
    if (typeof req.body.status !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Status must be true or false",
      });
    }

    const existing = await LoyaltyRuleModel.find(
      idParam(req),
      accessSalonId(req)
    );

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Loyalty rule not found",
      });
    }

    const data = await updateLoyaltyRuleStatus(
      existing.id,
      existing.salonId,
      req.body.status
    );

    return res.status(200).json({
      success: true,
      message: "Loyalty rule status updated successfully",
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
};
