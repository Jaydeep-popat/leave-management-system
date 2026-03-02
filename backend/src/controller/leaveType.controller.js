import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import LeaveType from "../model/LeaveType.js";

// ─── Create Leave Type ─────────────────────────────────────────────────────────
// POST /api/leave-types   [admin | hr]
const createLeaveType = asyncHandler(async (req, res) => {
    const { name, maxDaysPerYear, carryForwardAllowed, description } = req.body;

    if (!name || name.trim() === "") {
        throw new ApiError(400, "Leave type name is required");
    }
    if (!maxDaysPerYear || maxDaysPerYear < 1) {
        throw new ApiError(400, "maxDaysPerYear must be at least 1");
    }

    const existing = await LeaveType.findOne({ name: name.trim() });
    if (existing) {
        throw new ApiError(409, "Leave type with this name already exists");
    }

    const leaveType = await LeaveType.create({
        name: name.trim(),
        maxDaysPerYear,
        carryForwardAllowed: carryForwardAllowed ?? false,
        description: description?.trim(),
    });

    return res
        .status(201)
        .json(new apiResponse(201, leaveType, "Leave type created successfully"));
});

// ─── Get All Leave Types ───────────────────────────────────────────────────────
// GET /api/leave-types   [all authenticated]
const getAllLeaveTypes = asyncHandler(async (req, res) => {
    const { isActive } = req.query;

    const filter = {};
    // By default return only active leave types unless explicitly asked for all
    if (isActive !== undefined) {
        filter.isActive = isActive === "true";
    } else {
        filter.isActive = true;
    }

    const leaveTypes = await LeaveType.find(filter).sort({ name: 1 });

    return res
        .status(200)
        .json(new apiResponse(200, leaveTypes, "Leave types fetched successfully"));
});

// ─── Get Leave Type By ID ──────────────────────────────────────────────────────
// GET /api/leave-types/:id   [all authenticated]
const getLeaveTypeById = asyncHandler(async (req, res) => {
    const leaveType = await LeaveType.findById(req.params.id);

    if (!leaveType) {
        throw new ApiError(404, "Leave type not found");
    }

    return res
        .status(200)
        .json(
            new apiResponse(200, leaveType, "Leave type fetched successfully")
        );
});

// ─── Update Leave Type ─────────────────────────────────────────────────────────
// PATCH /api/leave-types/:id   [admin | hr]
const updateLeaveType = asyncHandler(async (req, res) => {
    const { name, maxDaysPerYear, carryForwardAllowed, description } = req.body;

    if (
        name === undefined &&
        maxDaysPerYear === undefined &&
        carryForwardAllowed === undefined &&
        description === undefined
    ) {
        throw new ApiError(400, "At least one field is required to update");
    }

    // Ensure new name is not taken by another leave type
    if (name) {
        const duplicate = await LeaveType.findOne({
            name: name.trim(),
            _id: { $ne: req.params.id },
        });
        if (duplicate) {
            throw new ApiError(
                409,
                "Another leave type with this name already exists"
            );
        }
    }

    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (maxDaysPerYear !== undefined) updateFields.maxDaysPerYear = maxDaysPerYear;
    if (carryForwardAllowed !== undefined)
        updateFields.carryForwardAllowed = carryForwardAllowed;
    if (description !== undefined) updateFields.description = description.trim();

    const updated = await LeaveType.findByIdAndUpdate(
        req.params.id,
        { $set: updateFields },
        { new: true, runValidators: true }
    );

    if (!updated) {
        throw new ApiError(404, "Leave type not found");
    }

    return res
        .status(200)
        .json(new apiResponse(200, updated, "Leave type updated successfully"));
});

// ─── Toggle Leave Type Active Status ──────────────────────────────────────────
// PATCH /api/leave-types/:id/toggle-status   [admin | hr]
const toggleLeaveTypeStatus = asyncHandler(async (req, res) => {
    const leaveType = await LeaveType.findById(req.params.id);

    if (!leaveType) {
        throw new ApiError(404, "Leave type not found");
    }

    leaveType.isActive = !leaveType.isActive;
    await leaveType.save();

    const message = leaveType.isActive
        ? "Leave type activated successfully"
        : "Leave type deactivated successfully";

    return res.status(200).json(new apiResponse(200, leaveType, message));
});

// ─── Delete Leave Type ─────────────────────────────────────────────────────────
// DELETE /api/leave-types/:id   [admin]
const deleteLeaveType = asyncHandler(async (req, res) => {
    const leaveType = await LeaveType.findByIdAndDelete(req.params.id);

    if (!leaveType) {
        throw new ApiError(404, "Leave type not found");
    }

    return res
        .status(200)
        .json(new apiResponse(200, {}, "Leave type deleted successfully"));
});

export {
    createLeaveType,
    getAllLeaveTypes,
    getLeaveTypeById,
    updateLeaveType,
    toggleLeaveTypeStatus,
    deleteLeaveType,
};
