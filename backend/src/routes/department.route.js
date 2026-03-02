import { Router } from "express";
import {
    createDepartment,
    getAllDepartments,
    getDepartmentById,
    updateDepartment,
    deleteDepartment,
} from "../controller/department.controller.js";
import { verifyJWT, authorizeRoles } from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
    validateCreateDepartment,
    validateUpdateDepartment,
    validateMongoIdParam,
} from "../validators/department.validators.js";

const router = Router();

// All department routes require authentication
router.use(verifyJWT);

// ─── Any Authenticated User ────────────────────────────────────────────────────
router.route("/").get(getAllDepartments);
router.route("/:id").get(validateMongoIdParam, validate, getDepartmentById);

// ─── Admin / HR Only ───────────────────────────────────────────────────────────
router
    .route("/")
    .post(authorizeRoles("admin", "hr"), validateCreateDepartment, validate, createDepartment);

router
    .route("/:id")
    .patch(authorizeRoles("admin", "hr"), validateUpdateDepartment, validate, updateDepartment)
    .delete(authorizeRoles("admin"), validateMongoIdParam, validate, deleteDepartment);

export default router;
