import { type Request, type Response } from "express";
import { UserModel } from "./user.model.js";
import { hashPass } from "../../utils/password.js";

export const getUsers = async (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    message: "Users fetched successfully",
    currentUser: req.user,
  });
};

export const createSalonAdmin = async (req: Request, res: Response) => {
  try {
    const { name, email, phone_number, password, salonId } = req.body;

    if (!name || !email || !phone_number || !password || !salonId) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingUser = await UserModel.findByEmail(email);

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    const existingPhone = await UserModel.findByPhoneNumber(phone_number);

    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: "Phone number already exists",
      });
    }

    const passwordHash = await hashPass(password);

    const admin = await UserModel.createSalonAdmin({
      name,
      email,
      phone_number,
      passwordHash,
      salonId,
    });

    return res.status(201).json({
      success: true,
      message: "Salon admin created successfully",
      data: admin,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
