import { body, param } from "express-validator";

export const validateCreateDepartment = [
    body("name")
        .trim()
        .notEmpty().withMessage("Department name is required")
        .isLength({ min: 2, max: 100 }).withMessage("Name must be 2–100 characters"),

    body("description")
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage("Description cannot exceed 500 characters"),

    body("manager")
        .optional()
        .isMongoId().withMessage("Manager must be a valid user ID"),
];

export const validateUpdateDepartment = [
    param("id")
        .isMongoId().withMessage("Department ID must be valid"),

    body("name")
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage("Name must be 2–100 characters"),

    body("description")
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage("Description cannot exceed 500 characters"),

    body("manager")
        .optional()
        .isMongoId().withMessage("Manager must be a valid user ID"),
];

export const validateMongoIdParam = [
    param("id")
        .isMongoId().withMessage("Provided ID is not valid"),
];
