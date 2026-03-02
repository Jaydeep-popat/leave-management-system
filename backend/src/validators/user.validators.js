import { body, param } from "express-validator";

export const validateRegister = [
    body("name")
        .trim()
        .notEmpty().withMessage("Name is required")
        .isLength({ min: 2, max: 50 }).withMessage("Name must be 2–50 characters"),

    body("email")
        .trim()
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Enter a valid email address")
        .normalizeEmail(),

    body("password")
        .notEmpty().withMessage("Password is required")
        .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),

    body("department")
        .notEmpty().withMessage("Department is required")
        .isMongoId().withMessage("Department must be a valid ID"),

    body("designation")
        .trim()
        .notEmpty().withMessage("Designation is required"),

    body("role")
        .optional()
        .isIn(["employee", "manager", "hr", "admin"])
        .withMessage("Role must be: employee, manager, hr, or admin"),
];

export const validateLogin = [
    body("email")
        .trim()
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Enter a valid email address")
        .normalizeEmail(),

    body("password")
        .notEmpty().withMessage("Password is required"),
];

export const validateChangePassword = [
    body("oldPassword")
        .notEmpty().withMessage("Old password is required"),

    body("newPassword")
        .notEmpty().withMessage("New password is required")
        .isLength({ min: 6 }).withMessage("New password must be at least 6 characters"),
];

export const validateUpdateAccount = [
    body("name")
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage("Name must be 2–50 characters"),

    body("designation")
        .optional()
        .trim()
        .notEmpty().withMessage("Designation cannot be empty"),

    body("department")
        .optional()
        .isMongoId().withMessage("Department must be a valid ID"),
];

export const validateUpdateUserStatus = [
    param("id")
        .isMongoId().withMessage("User ID must be a valid ID"),

    body("status")
        .notEmpty().withMessage("Status is required")
        .isIn(["active", "inactive"]).withMessage("Status must be: active or inactive"),
];
