import dotenv from 'dotenv';
import connectDB from "./db/index.js";
import { app } from './app.js';

dotenv.config({ path: "./.env" });

// ─── .env Validation with Defaults ────────────────────────────────────────────
const ENV_DEFAULTS = {
    PORT: "8000",
    ACCESS_TOKEN_EXPIRY: "1d",
    REFRESH_TOKEN_EXPIRY: "10d",
    CORS_ORIGIN: "http://localhost:4200",
    NODE_ENV: "development",
};

// Apply defaults for missing optional vars
Object.entries(ENV_DEFAULTS).forEach(([key, defaultValue]) => {
    if (!process.env[key]) {
        process.env[key] = defaultValue;
        console.warn(`[env] '${key}' not set — using default: '${defaultValue}'`);
    }
});

// These are required — crash early with a clear message if missing
const REQUIRED_ENV_VARS = [
    "MONGO_DB_URI",
    "ACCESS_TOKEN_SECRET",
    "REFRESH_TOKEN_SECRET",
];

const missingVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
if (missingVars.length > 0) {
    console.error(
        `[env] Missing required environment variable(s): ${missingVars.join(", ")}\n` +
        `Please define them in your .env file and restart.`
    );
    process.exit(1);
}

// ─── Start Server ──────────────────────────────────────────────────────────────
connectDB()
    .then(() => {
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT} [${process.env.NODE_ENV}]`);
        });
    })
    .catch((err) => {
        console.error("MongoDB connection failed:", err);
        process.exit(1);
    });

