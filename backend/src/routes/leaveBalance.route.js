import { Router } from "express";
import {
    allocateLeaveBalance,
    getMyLeaveBalance,
    getUserLeaveBalance,
    getAllLeaveBalances,
    updateLeaveBalance,
    bulkAllocateLeaveBalance,
} from "../controller/leaveBalance.controller.js";
import { verifyJWT, authorizeRoles } from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
    validateAllocateBalance,
    validateBulkAllocate,
    validateUpdateBalance,
    validateMongoIdParam,
} from "../validators/leaveBalance.validators.js";

const router = Router();

// All leave balance routes require authentication
router.use(verifyJWT);

// ─── Employee ──────────────────────────────────────────────────────────────────
router.route("/my").get(getMyLeaveBalance);

// ─── Admin / HR / Manager ──────────────────────────────────────────────────────
router
    .route("/")
    .get(authorizeRoles("admin", "hr", "manager"), getAllLeaveBalances)
    .post(authorizeRoles("admin", "hr"), validateAllocateBalance, validate, allocateLeaveBalance);

router
    .route("/bulk")
    .post(authorizeRoles("admin", "hr"), validateBulkAllocate, validate, bulkAllocateLeaveBalance);

router
    .route("/user/:userId")
    .get(authorizeRoles("admin", "hr", "manager"), getUserLeaveBalance);

router
    .route("/:id")
    .patch(authorizeRoles("admin", "hr"), validateUpdateBalance, validate, updateLeaveBalance);

export default router;
