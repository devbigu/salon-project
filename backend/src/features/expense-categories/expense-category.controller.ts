import { type Request, type Response } from "express";
import {
  cleanText,
  getSalonId,
  sendInventoryError,
} from "../products/inventory-access.js";
import { ExpenseCategoryModel } from "./expense-category.model.js";

const idParam = (req: Request) =>
  typeof req.params.id === "string" ? req.params.id : "";

const accessWhere = (req: Request, id?: string) => ({
  ...(id ? { id } : {}),
  ...(req.user?.role === "SUPER_ADMIN"
    ? typeof req.query.salonId === "string"
      ? { salonId: req.query.salonId }
      : {}
    : { salonId: req.user?.salonId || "__missing__" }),
});

export const createExpenseCategory = async (req: Request, res: Response) => {
  try {
    const salonId = getSalonId(req, req.body.salonId);
    const name = cleanText(req.body.name);
    if (!salonId || !name) {
      return res.status(400).json({
        success: false,
        message: "Category name and salon are required",
      });
    }
    if (await ExpenseCategoryModel.duplicate(salonId, name)) {
      return res.status(409).json({
        success: false,
        message: "Expense category already exists",
      });
    }
    const data = await ExpenseCategoryModel.create({ salonId, name });
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return sendInventoryError(res, error);
  }
};

export const getExpenseCategories = async (req: Request, res: Response) => {
  try {
    const data = await ExpenseCategoryModel.list({
      ...accessWhere(req),
      ...(req.query.status === "true" || req.query.status === "false"
        ? { status: req.query.status === "true" }
        : {}),
    });
    return res.json({ success: true, data });
  } catch (error) {
    return sendInventoryError(res, error);
  }
};

export const getExpenseCategory = async (req: Request, res: Response) => {
  try {
    const data = await ExpenseCategoryModel.find(
      accessWhere(req, idParam(req))
    );
    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Expense category not found",
      });
    }
    return res.json({ success: true, data });
  } catch (error) {
    return sendInventoryError(res, error);
  }
};

export const updateExpenseCategory = async (req: Request, res: Response) => {
  try {
    const existing = await ExpenseCategoryModel.find(
      accessWhere(req, idParam(req))
    );
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Expense category not found",
      });
    }
    const name = cleanText(req.body.name);
    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Category name is required" });
    }
    if (
      await ExpenseCategoryModel.duplicate(
        existing.salonId,
        name,
        existing.id
      )
    ) {
      return res.status(409).json({
        success: false,
        message: "Expense category already exists",
      });
    }
    const data = await ExpenseCategoryModel.update(existing.id, { name });
    return res.json({ success: true, data });
  } catch (error) {
    return sendInventoryError(res, error);
  }
};

export const setExpenseCategoryStatus = async (
  req: Request,
  res: Response
) => {
  try {
    if (typeof req.body.status !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Status must be true or false",
      });
    }
    const existing = await ExpenseCategoryModel.find(
      accessWhere(req, idParam(req))
    );
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Expense category not found",
      });
    }
    const data = await ExpenseCategoryModel.update(existing.id, {
      status: req.body.status,
    });
    return res.json({ success: true, data });
  } catch (error) {
    return sendInventoryError(res, error);
  }
};

export const deleteExpenseCategory = async (req: Request, res: Response) => {
  try {
    const existing = await ExpenseCategoryModel.find(
      accessWhere(req, idParam(req))
    );
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Expense category not found",
      });
    }
    if (existing._count.expenses > 0) {
      return res.status(409).json({
        success: false,
        message: "Deactivate categories already used by expenses",
      });
    }
    await ExpenseCategoryModel.remove(existing.id);
    return res.json({ success: true, message: "Expense category deleted" });
  } catch (error) {
    return sendInventoryError(res, error);
  }
};
