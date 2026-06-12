import {} from "express";
import { BranchModel } from "../models/branch.model.js";
export const createBranch = async (req, res) => {
    try {
        const { name, salonId, addressLine1, city, state, postalCode, phone, } = req.body;
        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Branch name is required",
            });
        }
        let finalSalonId;
        if (req.user?.role === "SUPER_ADMIN") {
            if (!salonId) {
                return res.status(400).json({
                    success: false,
                    message: "salonId is required for SUPER_ADMIN",
                });
            }
            finalSalonId = salonId;
        }
        else {
            finalSalonId = req.user?.salonId;
        }
        if (!finalSalonId) {
            return res.status(400).json({
                success: false,
                message: "Salon ID is missing",
            });
        }
        const branch = await BranchModel.create({
            name,
            salonId: finalSalonId,
            addressLine1,
            city,
            state,
            postalCode,
            phone,
        });
        return res.status(201).json({
            success: true,
            message: "Branch created successfully",
            data: branch,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
export const getBranches = async (req, res) => {
    try {
        if (req.user?.role === "SUPER_ADMIN") {
            const branches = await BranchModel.findAll();
            return res.status(200).json({
                success: true,
                message: "Branches fetched successfully",
                data: branches,
            });
        }
        if (!req.user?.salonId) {
            return res.status(400).json({
                success: false,
                message: "Salon ID is missing",
            });
        }
        const branches = await BranchModel.findBySalon(req.user.salonId);
        return res.status(200).json({
            success: true,
            message: "Branches fetched successfully",
            data: branches,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
//# sourceMappingURL=branch.controller.js.map