import { validationResult } from "express-validator";
import { ApiError } from "../utils/apiError.js";

// ─── Validate Middleware ───────────────────────────────────────────────────────
// Place this AFTER your express-validator rule arrays in any route.
// It collects all validation errors and throws a single 400 ApiError.
const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // Collect all error messages into one readable array
        const errorMessages = errors.array().map((err) => err.msg);
        throw new ApiError(400, errorMessages[0], errorMessages);
    }

    next();
};

export default validate;
