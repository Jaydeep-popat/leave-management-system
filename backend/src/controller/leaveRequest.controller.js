import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import LeaveRequest from "../model/LeaveRequest.js";
import LeaveBalance from "../model/LeaveBalance.js";
import LeaveType from "../model/LeaveType.js";

// ─── Helper: Calculate business days between two dates (inclusive) ─────────────
const calculateTotalDays = (fromDate, toDate) => {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    let count = 0;
    const current = new Date(from);

    while (current <= to) {
        const day = current.getDay();
        // Count Mon–Sat (skip Sunday = 0)
        if (day !== 0) count++;
        current.setDate(current.getDate() + 1);
    }
    return count;
};

// ─── Apply For Leave ───────────────────────────────────────────────────────────
// POST /api/leave-requests   [employee]
const applyLeave = asyncHandler(async (req, res) => {
    const { leaveType, fromDate, toDate, reason } = req.body;

    if (!leaveType || !fromDate || !toDate || !reason) {
        throw new ApiError(
            400,
            "leaveType, fromDate, toDate and reason are required"
        );
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);

    if (isNaN(from) || isNaN(to)) {
        throw new ApiError(400, "Invalid date format");
    }
    if (to < from) {
        throw new ApiError(400, "toDate must be greater than or equal to fromDate");
    }
    if (from.getFullYear() !== to.getFullYear()) {
        throw new ApiError(400, "Leave request cannot span multiple calendar years");
    }

    // Verify the leave type exists and is active
    const leaveTypeDoc = await LeaveType.findById(leaveType);
    if (!leaveTypeDoc) {
        throw new ApiError(404, "Leave type not found");
    }
    if (!leaveTypeDoc.isActive) {
        throw new ApiError(400, "This leave type is currently inactive");
    }

    const totalDays = calculateTotalDays(from, to);
    const requestYear = from.getFullYear();

    // Check leave balance
    const balance = await LeaveBalance.findOne({
        user: req.user._id,
        leaveType,
        year: requestYear,
    });

    if (!balance) {
        throw new ApiError(400, `No leave balance allocated for this leave type in year ${requestYear}`);
    }
    if (balance.remaining < totalDays) {
        throw new ApiError(
            400,
            `Insufficient leave balance. Available: ${balance.remaining}, Requested: ${totalDays}`
        );
    }

    // Check for overlapping pending/approved requests
    const overlap = await LeaveRequest.findOne({
        employee: req.user._id,
        status: { $in: ["pending", "approved"] },
        $or: [
            { fromDate: { $lte: to }, toDate: { $gte: from } },
        ],
    });

    if (overlap) {
        throw new ApiError(
            409,
            "You already have a pending or approved leave that overlaps with these dates"
        );
    }

    const leaveRequest = await LeaveRequest.create({
        employee: req.user._id,
        leaveType,
        fromDate: from,
        toDate: to,
        totalDays,
        reason: reason.trim(),
    });

    const populated = await LeaveRequest.findById(leaveRequest._id)
        .populate("employee", "name email designation")
        .populate("leaveType", "name maxDaysPerYear");

    return res
        .status(201)
        .json(new apiResponse(201, populated, "Leave application submitted successfully"));
});

// ─── Get My Leave Requests ─────────────────────────────────────────────────────
// GET /api/leave-requests/my   [employee]
const getMyLeaveRequests = asyncHandler(async (req, res) => {
    const { status, year, page = 1, limit = 10 } = req.query;

    const filter = { employee: req.user._id };
    if (status) filter.status = status;
    if (year) {
        const y = Number(year);
        filter.fromDate = {
            $gte: new Date(`${y}-01-01`),
            $lte: new Date(`${y}-12-31`),
        };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [requests, total] = await Promise.all([
        LeaveRequest.find(filter)
            .populate("leaveType", "name")
            .populate("approvedBy", "name email")
            .sort({ appliedAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        LeaveRequest.countDocuments(filter),
    ]);

    return res.status(200).json(
        new apiResponse(
            200,
            {
                requests,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit)),
                },
            },
            "Leave requests fetched successfully"
        )
    );
});

// ─── Get All Leave Requests (Admin / HR / Manager) ─────────────────────────────
// GET /api/leave-requests   [admin | hr | manager]
const getAllLeaveRequests = asyncHandler(async (req, res) => {
    const {
        status,
        employee,
        leaveType,
        year,
        page = 1,
        limit = 10,
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (employee) filter.employee = employee;
    if (leaveType) filter.leaveType = leaveType;
    if (year) {
        const y = Number(year);
        filter.fromDate = {
            $gte: new Date(`${y}-01-01`),
            $lte: new Date(`${y}-12-31`),
        };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [requests, total] = await Promise.all([
        LeaveRequest.find(filter)
            .populate("employee", "name email designation department")
            .populate("leaveType", "name")
            .populate("approvedBy", "name email")
            .sort({ appliedAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        LeaveRequest.countDocuments(filter),
    ]);

    return res.status(200).json(
        new apiResponse(
            200,
            {
                requests,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit)),
                },
            },
            "All leave requests fetched successfully"
        )
    );
});

// ─── Get Leave Request By ID ───────────────────────────────────────────────────
// GET /api/leave-requests/:id   [all authenticated]
const getLeaveRequestById = asyncHandler(async (req, res) => {
    const leaveRequest = await LeaveRequest.findById(req.params.id)
        .populate("employee", "name email designation")
        .populate("leaveType", "name maxDaysPerYear")
        .populate("approvedBy", "name email");

    if (!leaveRequest) {
        throw new ApiError(404, "Leave request not found");
    }

    // Employees can only view their own requests
    if (
        req.user.role === "employee" &&
        leaveRequest.employee._id.toString() !== req.user._id.toString()
    ) {
        throw new ApiError(403, "You are not allowed to view this leave request");
    }

    return res
        .status(200)
        .json(
            new apiResponse(200, leaveRequest, "Leave request fetched successfully")
        );
});

// ─── Approve Leave Request ─────────────────────────────────────────────────────
// PATCH /api/leave-requests/:id/approve   [admin | hr | manager]
const approveLeaveRequest = asyncHandler(async (req, res) => {
    const leaveRequest = await LeaveRequest.findById(req.params.id);

    if (!leaveRequest) {
        throw new ApiError(404, "Leave request not found");
    }
    if (leaveRequest.status !== "pending") {
        throw new ApiError(
            400,
            `Cannot approve a request that is already ${leaveRequest.status}`
        );
    }

    const currentYear = new Date(leaveRequest.fromDate).getFullYear();

    // Deduct from leave balance
    const balance = await LeaveBalance.findOne({
        user: leaveRequest.employee,
        leaveType: leaveRequest.leaveType,
        year: currentYear,
    });

    if (!balance || balance.remaining < leaveRequest.totalDays) {
        throw new ApiError(
            400,
            "Employee does not have sufficient leave balance to approve this request"
        );
    }

    balance.used += leaveRequest.totalDays;
    balance.remaining -= leaveRequest.totalDays;
    await balance.save();

    leaveRequest.status = "approved";
    leaveRequest.approvedBy = req.user._id;
    leaveRequest.actionedAt = new Date();
    await leaveRequest.save();

    const updated = await LeaveRequest.findById(leaveRequest._id)
        .populate("employee", "name email")
        .populate("leaveType", "name")
        .populate("approvedBy", "name email");

    return res
        .status(200)
        .json(new apiResponse(200, updated, "Leave request approved successfully"));
});

// ─── Reject Leave Request ──────────────────────────────────────────────────────
// PATCH /api/leave-requests/:id/reject   [admin | hr | manager]
const rejectLeaveRequest = asyncHandler(async (req, res) => {
    const { rejectionReason } = req.body;

    if (!rejectionReason || rejectionReason.trim() === "") {
        throw new ApiError(400, "Rejection reason is required");
    }

    const leaveRequest = await LeaveRequest.findById(req.params.id);

    if (!leaveRequest) {
        throw new ApiError(404, "Leave request not found");
    }
    if (leaveRequest.status !== "pending") {
        throw new ApiError(
            400,
            `Cannot reject a request that is already ${leaveRequest.status}`
        );
    }

    leaveRequest.status = "rejected";
    leaveRequest.approvedBy = req.user._id;
    leaveRequest.rejectionReason = rejectionReason.trim();
    leaveRequest.actionedAt = new Date();
    await leaveRequest.save();

    const updated = await LeaveRequest.findById(leaveRequest._id)
        .populate("employee", "name email")
        .populate("leaveType", "name")
        .populate("approvedBy", "name email");

    return res
        .status(200)
        .json(new apiResponse(200, updated, "Leave request rejected successfully"));
});

// ─── Cancel Leave Request ──────────────────────────────────────────────────────
// PATCH /api/leave-requests/:id/cancel   [employee — own request only]
const cancelLeaveRequest = asyncHandler(async (req, res) => {
    const leaveRequest = await LeaveRequest.findById(req.params.id);

    if (!leaveRequest) {
        throw new ApiError(404, "Leave request not found");
    }

    // Only the owner can cancel
    if (leaveRequest.employee.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only cancel your own leave requests");
    }

    if (!["pending", "approved"].includes(leaveRequest.status)) {
        throw new ApiError(
            400,
            `Cannot cancel a request that is already ${leaveRequest.status}`
        );
    }

    // If the request was already approved, restore the balance
    if (leaveRequest.status === "approved") {
        const currentYear = new Date(leaveRequest.fromDate).getFullYear();

        await LeaveBalance.findOneAndUpdate(
            {
                user: leaveRequest.employee,
                leaveType: leaveRequest.leaveType,
                year: currentYear,
            },
            {
                $inc: {
                    used: -leaveRequest.totalDays,
                    remaining: leaveRequest.totalDays,
                },
            }
        );
    }

    leaveRequest.status = "cancelled";
    leaveRequest.actionedAt = new Date();
    await leaveRequest.save();

    return res
        .status(200)
        .json(new apiResponse(200, leaveRequest, "Leave request cancelled successfully"));
});

export {
    applyLeave,
    getMyLeaveRequests,
    getAllLeaveRequests,
    getLeaveRequestById,
    approveLeaveRequest,
    rejectLeaveRequest,
    cancelLeaveRequest,
};
