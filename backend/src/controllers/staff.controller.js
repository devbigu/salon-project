import {} from "express";
import { StaffModel } from "../models/staff.model.js";
import { BranchModel } from "../models/branch.model.js";
const getStaffIdParam = (req) => {
    const { id } = req.params;
    return typeof id === "string" ? id : null;
};
export const createStaff = async (req, res) => {
    try {
        const { name, email, phone, jobRole, workingFrom, workingTo, weekOff, salonId, branchId, reportingManagerId, } = req.body;
        if (!name || !email || !jobRole || !workingFrom || !workingTo || !weekOff) {
            return res.status(400).json({
                success: false,
                message: "Required fields are missing",
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
        if (branchId) {
            const branch = await BranchModel.findByIdandSalon(branchId, finalSalonId);
            if (!branch) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid branch for this salon",
                });
            }
        }
        const staff = await StaffModel.create({
            name,
            email,
            phone,
            jobRole,
            workingFrom,
            workingTo,
            weekOff,
            salonId: finalSalonId,
            branchId,
            reportingManagerId,
        });
        return res.status(201).json({
            success: true,
            message: "Staff created successfully",
            data: staff,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
export const updateStaffStatus = async (req, res) => {
    try {
        const id = getStaffIdParam(req);
        const { status } = req.body;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Staff ID is required",
            });
        }
        if (typeof status !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "Status must be true or false",
            });
        }
        let existingStaff;
        if (req.user?.role === "SUPER_ADMIN") {
            existingStaff = await StaffModel.findById(id);
        }
        else {
            if (!req.user?.salonId) {
                return res.status(400).json({
                    success: false,
                    message: "Salon ID is missing",
                });
            }
            existingStaff = await StaffModel.findByIdAndSalon(id, req.user.salonId);
        }
        if (!existingStaff) {
            return res.status(404).json({
                success: false,
                message: "Staff not found",
            });
        }
        const updatedStaff = await StaffModel.updateStatus(id, status);
        return res.status(200).json({
            success: true,
            message: "Staff status updated successfully",
            data: updatedStaff,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
export const deleteStaff = async (req, res) => {
    try {
        const id = getStaffIdParam(req);
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Staff ID is required",
            });
        }
        let existingStaff;
        if (req.user?.role === "SUPER_ADMIN") {
            existingStaff = await StaffModel.findById(id);
        }
        else {
            if (!req.user?.salonId) {
                return res.status(400).json({
                    success: false,
                    message: "Salon ID is missing",
                });
            }
            existingStaff = await StaffModel.findByIdAndSalon(id, req.user.salonId);
        }
        if (!existingStaff) {
            return res.status(404).json({
                success: false,
                message: "Staff not found",
            });
        }
        await StaffModel.delete(id);
        return res.status(200).json({
            success: true,
            message: "Staff deleted successfully",
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
export const updateStaff = async (req, res) => {
    try {
        const id = getStaffIdParam(req);
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Staff ID is required",
            });
        }
        let existingStaff;
        if (req.user?.role === "SUPER_ADMIN") {
            existingStaff = await StaffModel.findById(id);
        }
        else {
            if (!req.user?.salonId) {
                return res.status(400).json({
                    success: false,
                    message: "Salon ID is missing",
                });
            }
            existingStaff = await StaffModel.findByIdAndSalon(id, req.user.salonId);
        }
        if (!existingStaff) {
            return res.status(404).json({
                success: false,
                message: "Staff not found",
            });
        }
        const updatedStaff = await StaffModel.update(id, {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            jobRole: req.body.jobRole,
            workingFrom: req.body.workingFrom,
            workingTo: req.body.workingTo,
            weekOff: req.body.weekOff,
            branchId: req.body.branchId,
            reportingManagerId: req.body.reportingManagerId,
        });
        return res.status(200).json({
            success: true,
            message: "Staff updated successfully",
            data: updatedStaff,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
export const getStaffById = async (req, res) => {
    try {
        const id = getStaffIdParam(req);
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Staff ID is required",
            });
        }
        let staff;
        if (req.user?.role === "SUPER_ADMIN") {
            staff = await StaffModel.findById(id);
        }
        else {
            if (!req.user?.salonId) {
                return res.status(400).json({
                    success: false,
                    message: "Salon ID is missing",
                });
            }
            staff = await StaffModel.findByIdAndSalon(id, req.user.salonId);
        }
        if (!staff) {
            return res.status(404).json({
                success: false,
                message: "Staff not found",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Staff fetched successfully",
            data: staff,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
export const getStaff = async (req, res) => {
    try {
        if (req.user?.role === "SUPER_ADMIN") {
            const staff = await StaffModel.findAll();
            return res.status(200).json({
                success: true,
                message: "Staff fetched successfully",
                data: staff,
            });
        }
        if (!req.user?.salonId) {
            return res.status(400).json({
                success: false,
                message: "Salon ID is missing",
            });
        }
        const staff = await StaffModel.findBySalon(req.user.salonId);
        return res.status(200).json({
            success: true,
            message: "Staff fetched successfully",
            data: staff,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
//# sourceMappingURL=staff.controller.js.map