import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import Department from "../model/Department.js";
import User from "../model/User.js";

// ─── Create Department ─────────────────────────────────────────────────────────
// POST /api/departments   [admin | hr]
const createDepartment = asyncHandler(async (req, res) => {
    const { name, description, manager } = req.body;

    if (!name || name.trim() === "") {
        throw new ApiError(400, "Department name is required");
    }

    // Check for duplicate name
    const existing = await Department.findOne({ name: name.trim() });
    if (existing) {
        throw new ApiError(409, "Department with this name already exists");
    }

    // If a manager is provided, verify the user exists and has a valid role
    if (manager) {
        const managerUser = await User.findById(manager);
        if (!managerUser) {
            throw new ApiError(404, "Manager user not found");
        }
        if (!["manager", "hr", "admin"].includes(managerUser.role)) {
            throw new ApiError(
                400,
                "Manager must have role: manager, hr, or admin"
            );
        }
    }

    const department = await Department.create({
        name: name.trim(),
        description: description?.trim(),
        manager: manager || undefined,
    });

    const created = await Department.findById(department._id).populate(
        "manager",
        "name email role"
    );

    return res
        .status(201)
        .json(new apiResponse(201, created, "Department created successfully"));
});

// ─── Get All Departments ───────────────────────────────────────────────────────
// GET /api/departments   [all authenticated]
const getAllDepartments = asyncHandler(async (req, res) => {
    const departments = await Department.find()
        .populate("manager", "name email role designation")
        .sort({ name: 1 });

    return res
        .status(200)
        .json(
            new apiResponse(200, departments, "Departments fetched successfully")
        );
});

// ─── Get Department By ID ──────────────────────────────────────────────────────
// GET /api/departments/:id   [all authenticated]
const getDepartmentById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const department = await Department.findById(id).populate(
        "manager",
        "name email role designation"
    );

    if (!department) {
        throw new ApiError(404, "Department not found");
    }

    return res
        .status(200)
        .json(new apiResponse(200, department, "Department fetched successfully"));
});

// ─── Update Department ─────────────────────────────────────────────────────────
// PATCH /api/departments/:id   [admin | hr]
const updateDepartment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, manager } = req.body;

    if (!name && !description && manager === undefined) {
        throw new ApiError(400, "At least one field is required to update");
    }

    // Check new name isn't taken by another department
    if (name) {
        const duplicate = await Department.findOne({
            name: name.trim(),
            _id: { $ne: id },
        });
        if (duplicate) {
            throw new ApiError(
                409,
                "Another department with this name already exists"
            );
        }
    }

    // Validate new manager if provided
    if (manager) {
        const managerUser = await User.findById(manager);
        if (!managerUser) {
            throw new ApiError(404, "Manager user not found");
        }
        if (!["manager", "hr", "admin"].includes(managerUser.role)) {
            throw new ApiError(
                400,
                "Manager must have role: manager, hr, or admin"
            );
        }
    }

    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (description !== undefined) updateFields.description = description.trim();
    if (manager !== undefined) updateFields.manager = manager || null;

    const updated = await Department.findByIdAndUpdate(
        id,
        { $set: updateFields },
        { new: true, runValidators: true }
    ).populate("manager", "name email role designation");

    if (!updated) {
        throw new ApiError(404, "Department not found");
    }

    return res
        .status(200)
        .json(new apiResponse(200, updated, "Department updated successfully"));
});

// ─── Delete Department ─────────────────────────────────────────────────────────
// DELETE /api/departments/:id   [admin]
const deleteDepartment = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Prevent deletion if users are assigned to this department
    const usersInDept = await User.countDocuments({ department: id });
    if (usersInDept > 0) {
        throw new ApiError(
            400,
            `Cannot delete department. ${usersInDept} user(s) are still assigned to it.`
        );
    }

    const department = await Department.findByIdAndDelete(id);
    if (!department) {
        throw new ApiError(404, "Department not found");
    }

    return res
        .status(200)
        .json(new apiResponse(200, {}, "Department deleted successfully"));
});

export {
    createDepartment,
    getAllDepartments,
    getDepartmentById,
    updateDepartment,
    deleteDepartment,
};
