import { type NextFunction, type Request, type Response } from "express";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isUuid = (value: unknown): value is string =>
  typeof value === "string" && UUID_PATTERN.test(value);

export const validateUuidParam = (paramName: string) =>
  (req: Request, res: Response, next: NextFunction) => {
    const value = req.params[paramName];
    if (!isUuid(value)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }
    next();
  };
