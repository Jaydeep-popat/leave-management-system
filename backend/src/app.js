import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true
}));

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// ─── Routes ────────────────────────────────────────────────────────────────────
import userRouter from './routes/user.route.js';
import departmentRouter from './routes/department.route.js';
import leaveTypeRouter from './routes/leaveType.route.js';
import leaveRequestRouter from './routes/leaveRequest.route.js';
import leaveBalanceRouter from './routes/leaveBalance.route.js';

app.use("/api/users", userRouter);
app.use("/api/departments", departmentRouter);
app.use("/api/leave-types", leaveTypeRouter);
app.use("/api/leave-requests", leaveRequestRouter);
app.use("/api/leave-balances", leaveBalanceRouter);

// ─── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    return res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors: err.errors || [],
    });
});

export { app }; 
