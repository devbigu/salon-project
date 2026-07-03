import { type Request, type Response } from "express";
import { cleanText, getSalonId } from "../products/inventory-access.js";
import { MembershipModel } from "./membership.model.js";

const membershipIdParam = (req: Request) =>
  typeof req.params.id === "string" ? req.params.id : "";

const accessSalonId = (req: Request) =>
  req.user?.role === "SUPER_ADMIN" ? undefined : req.user?.salonId;

const listSalonId = (req: Request) =>
  req.user?.role === "SUPER_ADMIN"
    ? typeof req.query.salonId === "string"
      ? req.query.salonId
      : undefined
    : req.user?.salonId;

const parseDiscountPercentage = (value: unknown) => {
  if (
    (typeof value !== "number" && typeof value !== "string") ||
    (typeof value === "string" && !value.trim())
  ) {
    return null;
  }

  const discountPercentage = Number(value);
  return Number.isFinite(discountPercentage) &&
    discountPercentage >= 0 &&
    discountPercentage <= 100
    ? discountPercentage
    : null;
};

const sendMembershipError = (res: Response, error: unknown) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  ) {
    return res.status(409).json({
      success: false,
      message: "Membership name already exists in this salon",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};

export const createMembership = async (req: Request, res: Response) => {
  try {
    const salonId = getSalonId(req, req.body.salonId);
    const name = cleanText(req.body.name);
    const description = cleanText(req.body.description);
    const discountPercentage =
      req.body.discountPercentage === undefined
        ? 0
        : parseDiscountPercentage(req.body.discountPercentage);

    if (!salonId || !name) {
      return res.status(400).json({
        success: false,
        message: "Membership name and salon are required",
      });
    }

    if (discountPercentage === null) {
      return res.status(400).json({
        success: false,
        message: "Discount percentage must be between 0 and 100",
      });
    }

    if (!(await MembershipModel.salonExists(salonId))) {
      return res.status(400).json({
        success: false,
        message: "Invalid salon",
      });
    }

    if (await MembershipModel.duplicate(salonId, name)) {
      return res.status(409).json({
        success: false,
        message: "Membership name already exists in this salon",
      });
    }

    const data = await MembershipModel.create({
      salonId,
      name,
      discountPercentage,
      ...(description ? { description } : {}),
    });

    return res.status(201).json({
      success: true,
      message: "Membership created successfully",
      data,
    });
  } catch (error) {
    return sendMembershipError(res, error);
  }
};

export const getMemberships = async (req: Request, res: Response) => {
  try {
    const salonId = listSalonId(req);

    if (req.user?.role !== "SUPER_ADMIN" && !salonId) {
      return res.status(400).json({
        success: false,
        message: "Salon ID is missing",
      });
    }

    const data = await MembershipModel.list(salonId);
    return res.status(200).json({
      success: true,
      message: "Memberships fetched successfully",
      data,
    });
  } catch (error) {
    return sendMembershipError(res, error);
  }
};

export const getMembership = async (req: Request, res: Response) => {
  try {
    const data = await MembershipModel.find(
      membershipIdParam(req),
      accessSalonId(req)
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Membership not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Membership fetched successfully",
      data,
    });
  } catch (error) {
    return sendMembershipError(res, error);
  }
};

export const updateMembership = async (req: Request, res: Response) => {
  try {
    const existing = await MembershipModel.find(
      membershipIdParam(req),
      accessSalonId(req)
    );

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Membership not found",
      });
    }

    const name =
      req.body.name === undefined ? undefined : cleanText(req.body.name);
    const description =
      req.body.description === undefined
        ? undefined
        : cleanText(req.body.description) ?? null;
    const discountPercentage =
      req.body.discountPercentage === undefined
        ? undefined
        : parseDiscountPercentage(req.body.discountPercentage);

    if (req.body.name !== undefined && !name) {
      return res.status(400).json({
        success: false,
        message: "Membership name is required",
      });
    }

    if (discountPercentage === null) {
      return res.status(400).json({
        success: false,
        message: "Discount percentage must be between 0 and 100",
      });
    }

    if (
      name &&
      (await MembershipModel.duplicate(existing.salonId, name, existing.id))
    ) {
      return res.status(409).json({
        success: false,
        message: "Membership name already exists in this salon",
      });
    }

    const data = await MembershipModel.update(existing.id, {
      ...(name ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(discountPercentage !== undefined ? { discountPercentage } : {}),
    });

    return res.status(200).json({
      success: true,
      message: "Membership updated successfully",
      data,
    });
  } catch (error) {
    return sendMembershipError(res, error);
  }
};

export const setMembershipStatus = async (req: Request, res: Response) => {
  try {
    if (typeof req.body.status !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Status must be true or false",
      });
    }

    const existing = await MembershipModel.find(
      membershipIdParam(req),
      accessSalonId(req)
    );

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Membership not found",
      });
    }

    const data = await MembershipModel.update(existing.id, {
      status: req.body.status,
    });

    return res.status(200).json({
      success: true,
      message: "Membership status updated successfully",
      data,
    });
  } catch (error) {
    return sendMembershipError(res, error);
  }
};

export const deleteMembership = async (req: Request, res: Response) => {
  try {
    const existing = await MembershipModel.find(
      membershipIdParam(req),
      accessSalonId(req)
    );

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Membership not found",
      });
    }

    if (existing._count.customers > 0) {
      const data = await MembershipModel.update(existing.id, {
        status: false,
      });

      return res.status(200).json({
        success: true,
        message: "Membership deactivated because customers are linked",
        data,
      });
    }

    await MembershipModel.remove(existing.id);
    return res.status(200).json({
      success: true,
      message: "Membership deleted successfully",
    });
  } catch (error) {
    return sendMembershipError(res, error);
  }
};
