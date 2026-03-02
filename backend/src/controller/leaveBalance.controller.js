import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import LeaveBalance from "../model/LeaveBalance.js";
import LeaveType from "../model/LeaveType.js";
import User from "../model/User.js";

// ─── Allocate Leave Balance ────────────────────────────────────────────────────
// POST /api/leave-balances   [admin | hr]
// Creates a new balance record for a user + leaveType + year combination
const allocateLeaveBalance = asyncHandler(async (req, res) => {
    const { user, leaveType, year, totalAllocated } = req.body;

    if (!user || !leaveType || !year || totalAllocated === undefined) {
        throw new ApiError(
            400,
            "user, leaveType, year and totalAllocated are required"
        );
    }
    if (totalAllocated < 0) {
        throw new ApiError(400, "totalAllocated cannot be negative");
    }

    // Validate user and leaveType exist
    const [userDoc, leaveTypeDoc] = await Promise.all([
        User.findById(user),
        LeaveType.findById(leaveType),
    ]);

    if (!userDoc) throw new ApiError(404, "User not found");
    if (!leaveTypeDoc) throw new ApiError(404, "Leave type not found");
    if (!leaveTypeDoc.isActive) {
        throw new ApiError(400, "Cannot allocate balance for an inactive leave type");
    }

    // Enforce max allocation cap from leave type
    if (totalAllocated > leaveTypeDoc.maxDaysPerYear) {
        throw new ApiError(
            400,
            `totalAllocated cannot exceed maxDaysPerYear (${leaveTypeDoc.maxDaysPerYear}) for this leave type`
        );
    }

    // Check if a balance record already exists for this combination
    const existing = await LeaveBalance.findOne({ user, leaveType, year });
    if (existing) {
        throw new ApiError(
            409,
            "Leave balance already allocated for this user, leave type, and year"
        );
    }

    const balance = await LeaveBalance.create({
        user,
        leaveType,
        year,
        totalAllocated,
        used: 0,
        remaining: totalAllocated,
    });

    const populated = await LeaveBalance.findById(balance._id)
        .populate("user", "name email designation")
        .populate("leaveType", "name maxDaysPerYear");

    return res
        .status(201)
        .json(
            new apiResponse(201, populated, "Leave balance allocated successfully")
        );
});

// ─── Get My Leave Balance ──────────────────────────────────────────────────────
// GET /api/leave-balances/my   [employee]
const getMyLeaveBalance = asyncHandler(async (req, res) => {
    const year = Number(req.query.year) || new Date().getFullYear();

    const balances = await LeaveBalance.find({
        user: req.user._id,
        year,
    }).populate("leaveType", "name maxDaysPerYear carryForwardAllowed");

    return res
        .status(200)
        .json(
            new apiResponse(
                200,
                balances,
                `Leave balance for year ${year} fetched successfully`
            )
        );
});

// ─── Get Leave Balance Of A Specific User ─────────────────────────────────────
// GET /api/leave-balances/user/:userId   [admin | hr | manager]
const getUserLeaveBalance = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const year = Number(req.query.year) || new Date().getFullYear();

    const userDoc = await User.findById(userId);
    if (!userDoc) {
        throw new ApiError(404, "User not found");
    }

    const balances = await LeaveBalance.find({ user: userId, year }).populate(
        "leaveType",
        "name maxDaysPerYear carryForwardAllowed"
    );

    return res
        .status(200)
        .json(
            new apiResponse(
                200,
                balances,
                `Leave balance for user fetched successfully`
            )
        );
});

// ─── Get All Leave Balances ────────────────────────────────────────────────────
// GET /api/leave-balances   [admin | hr]
const getAllLeaveBalances = asyncHandler(async (req, res) => {
    const { year, leaveType, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (year) filter.year = Number(year);
    if (leaveType) filter.leaveType = leaveType;

    const skip = (Number(page) - 1) * Number(limit);

    const [balances, total] = await Promise.all([
        LeaveBalance.find(filter)
            .populate("user", "name email designation")
            .populate("leaveType", "name")
            .sort({ year: -1 })
            .skip(skip)
            .limit(Number(limit)),
        LeaveBalance.countDocuments(filter),
    ]);

    return res.status(200).json(
        new apiResponse(
            200,
            {
                balances,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit)),
                },
            },
            "All leave balances fetched successfully"
        )
    );
});

// ─── Update Leave Balance ──────────────────────────────────────────────────────
// PATCH /api/leave-balances/:id   [admin | hr]
// Allows manual adjustment of totalAllocated (remaining is recalculated)
const updateLeaveBalance = asyncHandler(async (req, res) => {
    const { totalAllocated } = req.body;

    if (totalAllocated === undefined) {
        throw new ApiError(400, "totalAllocated is required");
    }
    if (totalAllocated < 0) {
        throw new ApiError(400, "totalAllocated cannot be negative");
    }

    const balance = await LeaveBalance.findById(req.params.id);
    if (!balance) {
        throw new ApiError(404, "Leave balance record not found");
    }

    if (totalAllocated < balance.used) {
        throw new ApiError(
            400,
            `totalAllocated (${totalAllocated}) cannot be less than already used days (${balance.used})`
        );
    }

    balance.totalAllocated = totalAllocated;
    // Recalculate remaining whenever totalAllocated changes
    balance.remaining = totalAllocated - balance.used;
    await balance.save();

    const updated = await LeaveBalance.findById(balance._id)
        .populate("user", "name email designation")
        .populate("leaveType", "name maxDaysPerYear");

    return res
        .status(200)
        .json(
            new apiResponse(200, updated, "Leave balance updated successfully")
        );
});

// ─── Bulk Allocate Leave Balances ──────────────────────────────────────────────
// POST /api/leave-balances/bulk   [admin | hr]
// Allocates all active leave types (with their maxDaysPerYear) to a user for a given year
const bulkAllocateLeaveBalance = asyncHandler(async (req, res) => {
    const { user, year } = req.body;

    if (!user || !year) {
        throw new ApiError(400, "user and year are required");
    }

    const userDoc = await User.findById(user);
    if (!userDoc) throw new ApiError(404, "User not found");

    const activeLeaveTypes = await LeaveType.find({ isActive: true });
    if (activeLeaveTypes.length === 0) {
        throw new ApiError(404, "No active leave types found");
    }

    const results = [];
    const skipped = [];

    for (const lt of activeLeaveTypes) {
        const existing = await LeaveBalance.findOne({
            user,
            leaveType: lt._id,
            year,
        });

        if (existing) {
            skipped.push(lt.name);
            continue;
        }

        const balance = await LeaveBalance.create({
            user,
            leaveType: lt._id,
            year,
            totalAllocated: lt.maxDaysPerYear,
            used: 0,
            remaining: lt.maxDaysPerYear,
        });
        results.push(balance);
    }

    return res.status(201).json(
        new apiResponse(
            201,
            { allocated: results.length, skipped },
            `Bulk allocation complete. ${results.length} record(s) created, ${skipped.length} skipped (already exist).`
        )
    );
});

export {
    allocateLeaveBalance,
    getMyLeaveBalance,
    getUserLeaveBalance,
    getAllLeaveBalances,
    updateLeaveBalance,
    bulkAllocateLeaveBalance,
};
