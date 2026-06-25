import { type Request, type Response } from "express";
import { ProductBrandModel } from "./product-brand.model.js";
import {
  cleanText,
  getSalonId,
  sendInventoryError,
} from "../products/inventory-access.js";

const idParam = (req: Request) =>
  typeof req.params.id === "string" ? req.params.id : "";

export const createProductBrand = async (req: Request, res: Response) => {
  try {
    const name = cleanText(req.body.name);
    const description = cleanText(req.body.description);
    const salonId = getSalonId(req, req.body.salonId);
    if (!name || !salonId) {
      return res.status(400).json({ success: false, message: "Brand name and salon are required" });
    }
    if (await ProductBrandModel.duplicate(salonId, name)) {
      return res.status(409).json({ success: false, message: "Product brand already exists" });
    }
    const data = await ProductBrandModel.create({
      salonId,
      name,
      ...(description ? { description } : {}),
    });
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return sendInventoryError(res, error);
  }
};

export const getProductBrands = async (req: Request, res: Response) => {
  try {
    const data = await ProductBrandModel.list(
      req.user?.role === "SUPER_ADMIN" ? undefined : req.user?.salonId
    );
    return res.json({ success: true, data });
  } catch (error) {
    return sendInventoryError(res, error);
  }
};

export const getProductBrand = async (req: Request, res: Response) => {
  try {
    const data = await ProductBrandModel.find(
      idParam(req),
      req.user?.role === "SUPER_ADMIN" ? undefined : req.user?.salonId
    );
    if (!data) return res.status(404).json({ success: false, message: "Product brand not found" });
    return res.json({ success: true, data });
  } catch (error) {
    return sendInventoryError(res, error);
  }
};

export const updateProductBrand = async (req: Request, res: Response) => {
  try {
    const existing = await ProductBrandModel.find(
      idParam(req),
      req.user?.role === "SUPER_ADMIN" ? undefined : req.user?.salonId
    );
    if (!existing) return res.status(404).json({ success: false, message: "Product brand not found" });
    const name = req.body.name === undefined ? undefined : cleanText(req.body.name);
    if (req.body.name !== undefined && !name) {
      return res.status(400).json({ success: false, message: "Brand name is required" });
    }
    if (name && await ProductBrandModel.duplicate(existing.salonId, name, existing.id)) {
      return res.status(409).json({ success: false, message: "Product brand already exists" });
    }
    const data = await ProductBrandModel.update(existing.id, {
      ...(name ? { name } : {}),
      ...("description" in req.body
        ? { description: cleanText(req.body.description) ?? null }
        : {}),
    });
    return res.json({ success: true, data });
  } catch (error) {
    return sendInventoryError(res, error);
  }
};

export const setProductBrandStatus = async (req: Request, res: Response) => {
  try {
    if (typeof req.body.status !== "boolean") {
      return res.status(400).json({ success: false, message: "Status must be true or false" });
    }
    const existing = await ProductBrandModel.find(
      idParam(req),
      req.user?.role === "SUPER_ADMIN" ? undefined : req.user?.salonId
    );
    if (!existing) return res.status(404).json({ success: false, message: "Product brand not found" });
    const data = await ProductBrandModel.update(existing.id, { status: req.body.status });
    return res.json({ success: true, data });
  } catch (error) {
    return sendInventoryError(res, error);
  }
};

export const deleteProductBrand = async (req: Request, res: Response) => {
  try {
    const existing = await ProductBrandModel.find(
      idParam(req),
      req.user?.role === "SUPER_ADMIN" ? undefined : req.user?.salonId
    );
    if (!existing) return res.status(404).json({ success: false, message: "Product brand not found" });
    if (existing._count.products > 0) {
      return res.status(409).json({ success: false, message: "Cannot delete a brand used by products" });
    }
    await ProductBrandModel.remove(existing.id);
    return res.json({ success: true, message: "Product brand deleted" });
  } catch (error) {
    return sendInventoryError(res, error);
  }
};
