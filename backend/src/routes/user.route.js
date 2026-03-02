import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    updateAccountDetails,
    changePassword,
    getAllUsers,
    updateUserStatus,
} from "../controller/user.controller.js";
import { verifyJWT, authorizeRoles } from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
    validateRegister,
    validateLogin,
    validateChangePassword,
    validateUpdateAccount,
    validateUpdateUserStatus,
} from "../validators/user.validators.js";

const router = Router();

// ─── Public Routes ─────────────────────────────────────────────────────────────
router.route("/register").post(validateRegister, validate, registerUser);
router.route("/login").post(validateLogin, validate, loginUser);
router.route("/refresh-token").post(refreshAccessToken);

// ─── Protected Routes (any authenticated user) ────────────────────────────────
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/me").get(verifyJWT, getCurrentUser);
router.route("/update").patch(verifyJWT, validateUpdateAccount, validate, updateAccountDetails);
router.route("/change-password").patch(verifyJWT, validateChangePassword, validate, changePassword);

// ─── Admin / HR only ──────────────────────────────────────────────────────────
router.route("/").get(verifyJWT, authorizeRoles("admin", "hr"), getAllUsers);
router
    .route("/:id/status")
    .patch(verifyJWT, authorizeRoles("admin"), validateUpdateUserStatus, validate, updateUserStatus);

export default router;

