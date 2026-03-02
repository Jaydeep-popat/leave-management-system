import { Router } from "express";
import {
    createLeaveType,
    getAllLeaveTypes,
    getLeaveTypeById,
    updateLeaveType,
    toggleLeaveTypeStatus,
    deleteLeaveType,
} from "../controller/leaveType.controller.js";
import { verifyJWT, authorizeRoles } from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
    validateCreateLeaveType,
    validateUpdateLeaveType,
    validateMongoIdParam,
} from "../validators/leaveType.validators.js";

const router = Router();

// All leave type routes require authentication
router.use(verifyJWT);

// ─── Any Authenticated User ────────────────────────────────────────────────────
router.route("/").get(getAllLeaveTypes);
router.route("/:id").get(validateMongoIdParam, validate, getLeaveTypeById);

// ─── Admin / HR Only ───────────────────────────────────────────────────────────
router
    .route("/")
    .post(authorizeRoles("admin", "hr"), validateCreateLeaveType, validate, createLeaveType);

router
    .route("/:id")
    .patch(authorizeRoles("admin", "hr"), validateUpdateLeaveType, validate, updateLeaveType)
    .delete(authorizeRoles("admin"), validateMongoIdParam, validate, deleteLeaveType);

router
    .route("/:id/toggle-status")
    .patch(authorizeRoles("admin", "hr"), validateMongoIdParam, validate, toggleLeaveTypeStatus);

export default router;
