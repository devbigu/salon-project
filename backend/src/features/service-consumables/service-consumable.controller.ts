import { type Request, type Response } from "express";
import { ServiceConsumableModel } from "./service-consumable.model.js";

const idParam = (req: Request, name: "id" | "serviceId") => {
  const value = req.params[name];
  return typeof value === "string" ? value : "";
};

const accessSalonId = (req: Request) =>
  req.user?.role === "SUPER_ADMIN" ? undefined : req.user?.salonId;

const restrictedBranchId = (req: Request) =>
  (req.user?.role === "BRANCH_MANAGER" || req.user?.role === "RECEPTIONIST")
    ? req.user.branchId
    : undefined;

const parseQuantity = (value: unknown) => {
  if (
    (typeof value !== "number" && typeof value !== "string") ||
    (typeof value === "string" && !value.trim())
  ) {
    return null;
  }
  const quantity = Number(value);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : null;
};

const sendError = (res: Response, error: unknown) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  ) {
    return res.status(409).json({
      success: false,
      message: "Product is already linked to this service",
    });
  }

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
  return res.status(status).json({ success: false, message });
};

const validateProduct = async (
  productId: string,
  salonId: string,
  serviceBranchId: string | null
) => {
  const product = await ServiceConsumableModel.findProduct(productId, salonId);
  if (!product) {
    throw Object.assign(new Error("Product not found in this salon"), {
      status: 404,
    });
  }
  if (!product.isServiceConsumable) {
    throw Object.assign(
      new Error("Product is not enabled as a service consumable"),
      { status: 400 }
    );
  }
  if (
    serviceBranchId &&
    product.branchId &&
    serviceBranchId !== product.branchId
  ) {
    throw Object.assign(
      new Error("Product and service belong to different branches"),
      { status: 400 }
    );
  }
  return product;
};

export const createServiceConsumable = async (
  req: Request,
  res: Response
) => {
  try {
    const serviceId = idParam(req, "serviceId");
    const productId =
      typeof req.body.productId === "string" ? req.body.productId : "";
    const quantity = parseQuantity(req.body.quantity);
    const service = await ServiceConsumableModel.findService(
      serviceId,
      accessSalonId(req)
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product is required",
      });
    }
    if (quantity === null) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    await validateProduct(productId, service.salonId, service.branchId);
    const existing = await ServiceConsumableModel.findByServiceAndProduct(
      service.salonId,
      service.id,
      productId
    );
    if (existing?.status) {
      return res.status(409).json({
        success: false,
        message: "Product is already linked to this service",
      });
    }

    const data = existing
      ? await ServiceConsumableModel.update(existing.id, {
          quantity,
          status: true,
        })
      : await ServiceConsumableModel.create({
          salonId: service.salonId,
          serviceId: service.id,
          productId,
          quantity,
        });

    return res.status(201).json({
      success: true,
      message: existing
        ? "Service consumable reactivated successfully"
        : "Service consumable created successfully",
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const getServiceConsumables = async (
  req: Request,
  res: Response
) => {
  try {
    const serviceId = idParam(req, "serviceId");
    const service = await ServiceConsumableModel.findService(
      serviceId,
      accessSalonId(req),
      restrictedBranchId(req)
    );
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }
    const data = await ServiceConsumableModel.listActive(
      service.id,
      service.salonId
    );
    return res.status(200).json({
      success: true,
      message: "Service consumables fetched successfully",
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const updateServiceConsumable = async (
  req: Request,
  res: Response
) => {
  try {
    const existing = await ServiceConsumableModel.find(
      idParam(req, "id"),
      accessSalonId(req)
    );
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Service consumable not found",
      });
    }

    const quantity =
      req.body.quantity === undefined
        ? undefined
        : parseQuantity(req.body.quantity);
    if (quantity === null) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    const productId =
      req.body.productId === undefined
        ? undefined
        : typeof req.body.productId === "string"
          ? req.body.productId
          : "";
    if (req.body.productId !== undefined && !productId) {
      return res.status(400).json({
        success: false,
        message: "Product is required",
      });
    }

    if (productId) {
      await validateProduct(
        productId,
        existing.salonId,
        existing.service.branchId
      );
      const duplicate = await ServiceConsumableModel.findByServiceAndProduct(
        existing.salonId,
        existing.serviceId,
        productId
      );
      if (duplicate && duplicate.id !== existing.id) {
        return res.status(409).json({
          success: false,
          message: "Product is already linked to this service",
        });
      }
    }

    const data = await ServiceConsumableModel.update(existing.id, {
      ...(productId ? { productId } : {}),
      ...(quantity !== undefined ? { quantity } : {}),
      ...(typeof req.body.status === "boolean"
        ? { status: req.body.status }
        : {}),
    });
    return res.status(200).json({
      success: true,
      message: "Service consumable updated successfully",
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const deleteServiceConsumable = async (
  req: Request,
  res: Response
) => {
  try {
    const existing = await ServiceConsumableModel.find(
      idParam(req, "id"),
      accessSalonId(req)
    );
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Service consumable not found",
      });
    }
    const data = await ServiceConsumableModel.update(existing.id, {
      status: false,
    });
    return res.status(200).json({
      success: true,
      message: "Service consumable deactivated successfully",
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
};
