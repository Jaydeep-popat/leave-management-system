import { body, param } from "express-validator";

export const validateCreateLeaveType = [
    body("name")
        .trim()
        .notEmpty().withMessage("Leave type name is required")
        .isLength({ min: 2, max: 100 }).withMessage("Name must be 2–100 characters"),

    body("maxDaysPerYear")
        .notEmpty().withMessage("maxDaysPerYear is required")
        .isInt({ min: 1, max: 365 }).withMessage("maxDaysPerYear must be between 1 and 365"),

    body("carryForwardAllowed")
        .optional()
        .isBoolean().withMessage("carryForwardAllowed must be a boolean"),

    body("description")
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage("Description cannot exceed 500 characters"),
];

export const validateUpdateLeaveType = [
    param("id")
        .isMongoId().withMessage("Leave type ID must be valid"),

    body("name")
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage("Name must be 2–100 characters"),

    body("maxDaysPerYear")
        .optional()
        .isInt({ min: 1, max: 365 }).withMessage("maxDaysPerYear must be between 1 and 365"),

    body("carryForwardAllowed")
        .optional()
        .isBoolean().withMessage("carryForwardAllowed must be a boolean"),

    body("description")
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage("Description cannot exceed 500 characters"),
];

export const validateMongoIdParam = [
    param("id")
        .isMongoId().withMessage("Provided ID is not valid"),
];
