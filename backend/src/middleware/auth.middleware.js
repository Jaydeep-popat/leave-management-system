import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import User from "../model/User.js";

// ─── Verify JWT ────────────────────────────────────────────────────────────────
// Attaches the authenticated user to req.user
export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        );

        if (!user) {
            throw new ApiError(401, "Invalid access token");
        }

        // Block inactive accounts from accessing protected routes
        if (user.status === "inactive") {
            throw new ApiError(403, "Your account is inactive. Contact admin.");
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});

// ─── Authorize Roles ───────────────────────────────────────────────────────────
// Usage: authorizeRoles("admin", "hr")
// Must be used AFTER verifyJWT so that req.user is available
export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user?.role)) {
            throw new ApiError(
                403,
                `Access denied. Required role(s): ${roles.join(", ")}`
            );
        }
        next();
    };
};
