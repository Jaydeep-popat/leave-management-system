import { body, param } from "express-validator";

export const validateApplyLeave = [
    body("leaveType")
        .notEmpty().withMessage("Leave type is required")
        .isMongoId().withMessage("Leave type must be a valid ID"),

    body("fromDate")
        .notEmpty().withMessage("fromDate is required")
        .isISO8601().withMessage("fromDate must be a valid date (YYYY-MM-DD)")
        .toDate(),

    body("toDate")
        .notEmpty().withMessage("toDate is required")
        .isISO8601().withMessage("toDate must be a valid date (YYYY-MM-DD)")
        .toDate()
        .custom((toDate, { req }) => {
            if (new Date(toDate) < new Date(req.body.fromDate)) {
                throw new Error("toDate must be greater than or equal to fromDate");
            }
            return true;
        }),

    body("reason")
        .trim()
        .notEmpty().withMessage("Reason is required")
        .isLength({ min: 5, max: 500 }).withMessage("Reason must be 5–500 characters"),
];

export const validateRejectLeave = [
    param("id")
        .isMongoId().withMessage("Leave request ID must be valid"),

    body("rejectionReason")
        .trim()
        .notEmpty().withMessage("Rejection reason is required")
        .isLength({ min: 5, max: 500 }).withMessage("Rejection reason must be 5–500 characters"),
];

export const validateMongoIdParam = [
    param("id")
        .isMongoId().withMessage("Provided ID is not valid"),
];
