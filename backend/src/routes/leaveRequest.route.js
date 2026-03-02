import { Router } from "express";
import {
    applyLeave,
    getMyLeaveRequests,
    getAllLeaveRequests,
    getLeaveRequestById,
    approveLeaveRequest,
    rejectLeaveRequest,
    cancelLeaveRequest,
} from "../controller/leaveRequest.controller.js";
import { verifyJWT, authorizeRoles } from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
    validateApplyLeave,
    validateRejectLeave,
    validateMongoIdParam,
} from "../validators/leaveRequest.validators.js";

const router = Router();

// All leave request routes require authentication
router.use(verifyJWT);

// ─── Employee ──────────────────────────────────────────────────────────────────
router.route("/apply").post(validateApplyLeave, validate, applyLeave);
router.route("/my").get(getMyLeaveRequests);
router.route("/:id/cancel").patch(validateMongoIdParam, validate, cancelLeaveRequest);

// ─── Any Authenticated User (ownership check happens in controller) ────────────
router.route("/:id").get(validateMongoIdParam, validate, getLeaveRequestById);

// ─── Admin / HR / Manager ──────────────────────────────────────────────────────
router
    .route("/")
    .get(authorizeRoles("admin", "hr", "manager"), getAllLeaveRequests);

router
    .route("/:id/approve")
    .patch(authorizeRoles("admin", "hr", "manager"), validateMongoIdParam, validate, approveLeaveRequest);

router
    .route("/:id/reject")
    .patch(authorizeRoles("admin", "hr", "manager"), validateRejectLeave, validate, rejectLeaveRequest);

export default router;
