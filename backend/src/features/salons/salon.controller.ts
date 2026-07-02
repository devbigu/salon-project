import { type Request, type Response } from "express";
import { SalonModel } from "./salon.model.js";
import { isValidTimezone } from "../../utils/timezone.js";

export const createSalon = async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      phone,
      addressLine1,
      city,
      state,
      postalCode,
      timezone,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Salon name is required",
      });
    }

    if (timezone && !isValidTimezone(timezone)) {
      return res.status(400).json({ success: false, message: "Invalid salon timezone" });
    }

    const salon = await SalonModel.create({
      name,
      email,
      phone,
      addressLine1,
      city,
      state,
      postalCode,
      ...(timezone ? { timezone } : {}),
    });

    return res.status(201).json({
      success: true,
      message: "Salon created successfully",
      data: salon,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getSalons = async (req: Request, res: Response) => {
  try {
    const salons = await SalonModel.findAll();

    return res.status(200).json({
      success: true,
      message: "Salons fetched successfully",
      data: salons,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
