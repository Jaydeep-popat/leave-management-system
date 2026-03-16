import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import User from "../model/User.js";
import LeaveType from "../model/LeaveType.js";
import LeaveBalance from "../model/LeaveBalance.js";
import jwt from "jsonwebtoken";

// ─── Cookie Options ────────────────────────────────────────────────────────────
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
};

// ─── Helper: Generate Access + Refresh Token ───────────────────────────────────
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating access and refresh tokens"
        );
    }
};

// ─── Register User ─────────────────────────────────────────────────────────────
// POST /api/users/register
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, role, department, designation } = req.body;

    // Validate required fields
    if (
        [name, email, password, department, designation].some(
            (field) => !field || field.toString().trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    // Check if email already exists
    const existedUser = await User.findOne({ email });
    if (existedUser) {
        throw new ApiError(409, "User with this email already exists");
    }

    // Create user — password is hashed via pre-save hook in model
    const user = await User.create({
        name,
        email,
        password,
        role,
        department,
        designation,
    });

    // Initialize leave balances for the current year for all active leave types
    // so newly registered users can apply leave immediately.
    try {
        const currentYear = new Date().getFullYear();
        const activeLeaveTypes = await LeaveType.find({ isActive: true }).select(
            "_id maxDaysPerYear"
        );

        if (activeLeaveTypes.length > 0) {
            const initialBalances = activeLeaveTypes.map((lt) => ({
                user: user._id,
                leaveType: lt._id,
                year: currentYear,
                totalAllocated: lt.maxDaysPerYear,
                used: 0,
                remaining: lt.maxDaysPerYear,
            }));

            await LeaveBalance.insertMany(initialBalances);
        }
    } catch {
        // Compensating action to avoid creating users without initialized balances.
        await User.findByIdAndDelete(user._id);
        throw new ApiError(
            500,
            "Unable to initialize leave balances for this user. Please try again."
        );
    }

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while creating the user");
    }

    return res
        .status(201)
        .json(new apiResponse(201, createdUser, "User registered successfully"));
});

// ─── Login User ────────────────────────────────────────────────────────────────
// POST /api/users/login
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    // Explicitly select password (select: false by default)
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Block inactive accounts
    if (user.status === "inactive") {
        throw new ApiError(403, "Your account is inactive. Contact admin.");
    }

    // Verify password
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
        user._id
    );

    const loggedInUser = await User.findById(user._id)
        .select("-password -refreshToken")
        .populate("department", "name");

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new apiResponse(
                200,
                { user: loggedInUser, accessToken },
                "Logged in successfully"
            )
        );
});

// ─── Logout User ───────────────────────────────────────────────────────────────
// POST /api/users/logout   [auth required]
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        { $set: { refreshToken: null } },
        { new: true }
    );

    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new apiResponse(200, {}, "Logged out successfully"));
});

// ─── Refresh Access Token ──────────────────────────────────────────────────────
// POST /api/users/refresh-token
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    let decodedToken;
    try {
        decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );
    } catch {
        throw new ApiError(401, "Invalid or expired refresh token");
    }

    const user = await User.findById(decodedToken._id).select("+refreshToken");
    if (!user) {
        throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user.refreshToken) {
        throw new ApiError(401, "Refresh token is expired or already used");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
        user._id
    );

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new apiResponse(
                200,
                { accessToken },
                "Access token refreshed successfully"
            )
        );
});

// ─── Get Current User ──────────────────────────────────────────────────────────
// GET /api/users/me   [auth required]
const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
        .select("-password -refreshToken")
        .populate("department", "name");

    return res
        .status(200)
        .json(new apiResponse(200, user, "Current user fetched successfully"));
});

// ─── Update Account Details ────────────────────────────────────────────────────
// PATCH /api/users/update   [auth required]
const updateAccountDetails = asyncHandler(async (req, res) => {
    const { name, designation, department } = req.body;

    if (!name && !designation && !department) {
        throw new ApiError(400, "At least one field is required to update");
    }

    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (designation) updateFields.designation = designation.trim();
    if (department) updateFields.department = department;

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updateFields },
        { new: true, runValidators: true }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(
            new apiResponse(200, updatedUser, "Account details updated successfully")
        );
});

// ─── Change Password ───────────────────────────────────────────────────────────
// PATCH /api/users/change-password   [auth required]
const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Old and new passwords are required");
    }

    const user = await User.findById(req.user._id).select("+password");

    const isPasswordValid = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordValid) {
        throw new ApiError(400, "Old password is incorrect");
    }

    if (oldPassword === newPassword) {
        throw new ApiError(400, "New password must be different from old password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: true });

    return res
        .status(200)
        .json(new apiResponse(200, {}, "Password changed successfully"));
});

// ─── Get All Users (Admin / HR only) ──────────────────────────────────────────
// GET /api/users   [auth required, role: admin | hr]
const getAllUsers = asyncHandler(async (req, res) => {
    const { role, status, department, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (department) filter.department = department;

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
        User.find(filter)
            .select("-password -refreshToken")
            .populate("department", "name")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        User.countDocuments(filter),
    ]);

    return res.status(200).json(
        new apiResponse(
            200,
            {
                users,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit)),
                },
            },
            "Users fetched successfully"
        )
    );
});

// ─── Update User Status (Admin only) ──────────────────────────────────────────
// PATCH /api/users/:id/status   [auth required, role: admin]
const updateUserStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["active", "inactive"].includes(status)) {
        throw new ApiError(400, "Valid status (active | inactive) is required");
    }

    const user = await User.findByIdAndUpdate(
        id,
        { $set: { status } },
        { new: true, runValidators: true }
    ).select("-password -refreshToken");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res
        .status(200)
        .json(new apiResponse(200, user, `User status updated to ${status}`));
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    updateAccountDetails,
    changePassword,
    getAllUsers,
    updateUserStatus,
};
