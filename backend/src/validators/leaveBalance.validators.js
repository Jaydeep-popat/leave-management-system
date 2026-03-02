import { body, param } from "express-validator";

export const validateAllocateBalance = [
    body("user")
        .notEmpty().withMessage("User is required")
        .isMongoId().withMessage("User must be a valid ID"),

    body("leaveType")
        .notEmpty().withMessage("Leave type is required")
        .isMongoId().withMessage("Leave type must be a valid ID"),

    body("year")
        .notEmpty().withMessage("Year is required")
        .isInt({ min: 2000, max: 2100 }).withMessage("Year must be a valid year (2000–2100)"),

    body("totalAllocated")
        .notEmpty().withMessage("totalAllocated is required")
        .isInt({ min: 0, max: 365 }).withMessage("totalAllocated must be between 0 and 365"),
];

export const validateBulkAllocate = [
    body("user")
        .notEmpty().withMessage("User is required")
        .isMongoId().withMessage("User must be a valid ID"),

    body("year")
        .notEmpty().withMessage("Year is required")
        .isInt({ min: 2000, max: 2100 }).withMessage("Year must be a valid year (2000–2100)"),
];

export const validateUpdateBalance = [
    param("id")
        .isMongoId().withMessage("Leave balance ID must be valid"),

    body("totalAllocated")
        .notEmpty().withMessage("totalAllocated is required")
        .isInt({ min: 0, max: 365 }).withMessage("totalAllocated must be between 0 and 365"),
];

export const validateMongoIdParam = [
    param("id")
        .isMongoId().withMessage("Provided ID is not valid"),
];
