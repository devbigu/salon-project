import type { NextFunction, Request, Response } from "express";
import { chatWithAiAssistant } from "./ai-assistant.service.js";
import { isAiRole } from "./ai-tool.types.js";

export async function chat(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const message =
      typeof req.body?.message === "string" ? req.body.message.trim() : "";

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required.",
      });
    }

    if (message.length > 2_000) {
      return res.status(400).json({
        success: false,
        message: "Message must be 2000 characters or fewer.",
      });
    }

    const user = req.user;
    if (!user || !isAiRole(user.role)) {
      return res.status(403).json({
        success: false,
        message: "AI assistant access is not available for this account.",
      });
    }

    const result = await chatWithAiAssistant({
      message,
      context: {
        userId: user.userId,
        role: user.role,
        ...(user.salonId ? { salonId: user.salonId } : {}),
        ...(user.branchId ? { branchId: user.branchId } : {}),
      },
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
