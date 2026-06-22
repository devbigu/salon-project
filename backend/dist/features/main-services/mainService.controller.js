import {} from "express";
import { MainServiceModel } from "./mainService.model.js";
const getFinalSalonId = (req, bodySalonId) => {
    if (req.user?.role === "SUPER_ADMIN") {
        return bodySalonId;
    }
    return req.user?.salonId;
};
const getMainServiceIdParam = (req) => {
    const { id } = req.params;
    return typeof id === "string" ? id : null;
};
const getExistingMainServiceByAccess = async (req, mainServiceId) => {
    if (req.user?.role === "SUPER_ADMIN") {
        return MainServiceModel.findById(mainServiceId);
    }
    const salonId = req.user?.salonId;
    if (!salonId) {
        return null;
    }
    return MainServiceModel.findByIdAndSalon(mainServiceId, salonId);
};
export const createMainService = async (req, res) => {
    try {
        const { name, salonId, status } = req.body;
        const normalizedName = typeof name === "string" ? name.trim() : "";
        if (!normalizedName) {
            return res.status(400).json({
                success: false,
                message: "Main service name is required",
            });
        }
        const finalSalonId = getFinalSalonId(req, salonId);
        if (!finalSalonId) {
            return res.status(400).json({
                success: false,
                message: "Salon ID is required",
            });
        }
        const existingMainService = await MainServiceModel.findByNameAndSalon(normalizedName, finalSalonId);
        if (existingMainService) {
            return res.status(400).json({
                success: false,
                message: "Main service already exists in this salon",
            });
        }
        const mainService = await MainServiceModel.create({
            name: normalizedName,
            salonId: finalSalonId,
            ...(typeof status === "boolean" ? { status } : {}),
        });
        return res.status(201).json({
            success: true,
            message: "Main service created successfully",
            data: mainService,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
export const getMainServices = async (req, res) => {
    try {
        if (req.user?.role === "SUPER_ADMIN") {
            const mainServices = await MainServiceModel.findAll();
            return res.status(200).json({
                success: true,
                message: "Main services fetched successfully",
                data: mainServices,
            });
        }
        if (!req.user?.salonId) {
            return res.status(400).json({
                success: false,
                message: "Salon ID is missing",
            });
        }
        const mainServices = await MainServiceModel.findBySalon(req.user.salonId);
        return res.status(200).json({
            success: true,
            message: "Main services fetched successfully",
            data: mainServices,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
export const getMainServiceById = async (req, res) => {
    try {
        const id = getMainServiceIdParam(req);
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Main service ID is required",
            });
        }
        const mainService = await getExistingMainServiceByAccess(req, id);
        if (!mainService) {
            return res.status(404).json({
                success: false,
                message: "Main service not found",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Main service fetched successfully",
            data: mainService,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
export const updateMainService = async (req, res) => {
    try {
        const id = getMainServiceIdParam(req);
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Main service ID is required",
            });
        }
        const existingMainService = await getExistingMainServiceByAccess(req, id);
        if (!existingMainService) {
            return res.status(404).json({
                success: false,
                message: "Main service not found",
            });
        }
        const { name, status } = req.body;
        const normalizedName = typeof name === "string" ? name.trim() : undefined;
        if (name !== undefined && !normalizedName) {
            return res.status(400).json({
                success: false,
                message: "Main service name is required",
            });
        }
        if (normalizedName) {
            const duplicateMainService = await MainServiceModel.findByNameAndSalon(normalizedName, existingMainService.salonId);
            if (duplicateMainService && duplicateMainService.id !== id) {
                return res.status(400).json({
                    success: false,
                    message: "Main service name already exists in this salon",
                });
            }
        }
        const updatedMainService = await MainServiceModel.update(id, {
            ...(normalizedName ? { name: normalizedName } : {}),
            ...(typeof status === "boolean" ? { status } : {}),
        });
        return res.status(200).json({
            success: true,
            message: "Main service updated successfully",
            data: updatedMainService,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
export const updateMainServiceStatus = async (req, res) => {
    try {
        const id = getMainServiceIdParam(req);
        const { status } = req.body;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Main service ID is required",
            });
        }
        if (typeof status !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "Status must be true or false",
            });
        }
        const existingMainService = await getExistingMainServiceByAccess(req, id);
        if (!existingMainService) {
            return res.status(404).json({
                success: false,
                message: "Main service not found",
            });
        }
        const updatedMainService = await MainServiceModel.updateStatus(id, status);
        return res.status(200).json({
            success: true,
            message: "Main service status updated successfully",
            data: updatedMainService,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
export const deleteMainService = async (req, res) => {
    try {
        const id = getMainServiceIdParam(req);
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Main service ID is required",
            });
        }
        const existingMainService = await getExistingMainServiceByAccess(req, id);
        if (!existingMainService) {
            return res.status(404).json({
                success: false,
                message: "Main service not found",
            });
        }
        await MainServiceModel.delete(id);
        return res.status(200).json({
            success: true,
            message: "Main service deleted successfully",
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error. Make sure this main service has no child services before deleting.",
        });
    }
};
