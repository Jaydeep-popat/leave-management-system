/**
 * SEED SCRIPT — Leave Management System
 *
 * Bypasses the HTTP layer entirely and writes directly to MongoDB
 * through Mongoose models (so all pre-save hooks, hashing, etc. still run).
 *
 * Usage:
 *   npm run seed          → insert seed data (skips if already seeded)
 *   npm run seed:fresh    → wipe all collections, then re-seed
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

dotenv.config({ path: "./.env" });

import { DB_NAME } from "./constant.js";
import User from "./model/User.js";
import Department from "./model/Department.js";
import LeaveType from "./model/LeaveType.js";
import LeaveBalance from "./model/LeaveBalance.js";
import LeaveRequest from "./model/LeaveRequest.js";

// ─── Connect ───────────────────────────────────────────────────────────────────
const connect = async () => {
    await mongoose.connect(`${process.env.MONGO_DB_URI}/${DB_NAME}`);
    console.log("✔  Database connected");
};

// ─── Disconnect ────────────────────────────────────────────────────────────────
const disconnect = async () => {
    await mongoose.disconnect();
    console.log("✔  Database disconnected");
};

// ─── Wipe Collections ──────────────────────────────────────────────────────────
const clearAll = async () => {
    await Promise.all([
        User.deleteMany({}),
        Department.deleteMany({}),
        LeaveType.deleteMany({}),
        LeaveBalance.deleteMany({}),
        LeaveRequest.deleteMany({}),
    ]);
    console.log("✔  All collections cleared");
};

// ─── Step 1 — Leave Types ──────────────────────────────────────────────────────
const seedLeaveTypes = async () => {
    const types = [
        {
            name: "Casual Leave",
            maxDaysPerYear: 12,
            carryForwardAllowed: false,
            description: "For personal or family matters",
        },
        {
            name: "Sick Leave",
            maxDaysPerYear: 10,
            carryForwardAllowed: false,
            description: "For illness or medical appointments",
        },
        {
            name: "Earned Leave",
            maxDaysPerYear: 18,
            carryForwardAllowed: true,
            description: "Accrued paid leave that can be carried forward",
        },
        {
            name: "Maternity Leave",
            maxDaysPerYear: 90,
            carryForwardAllowed: false,
            description: "For female employees — childbirth or adoption",
        },
        {
            name: "Paternity Leave",
            maxDaysPerYear: 7,
            carryForwardAllowed: false,
            description: "For male employees on birth of a child",
        },
        {
            name: "Compensatory Off",
            maxDaysPerYear: 10,
            carryForwardAllowed: true,
            description: "Leave granted for working on holidays or weekends",
        },
    ];

    const inserted = await LeaveType.insertMany(types);
    console.log(`✔  Leave types seeded (${inserted.length})`);
    return inserted;
};

// ─── Step 2 — Departments (without manager first) ─────────────────────────────
const seedDepartments = async () => {
    const depts = [
        { name: "Engineering", description: "Software development and maintenance" },
        { name: "Human Resources", description: "HR, recruitment and payroll" },
        { name: "Finance", description: "Accounting and financial planning" },
        { name: "Marketing", description: "Marketing and brand management" },
        { name: "Operations", description: "Business operations and logistics" },
    ];

    const inserted = await Department.insertMany(depts);
    console.log(`✔  Departments seeded (${inserted.length})`);
    return inserted;
};

// ─── Step 3 — Users ────────────────────────────────────────────────────────────
// Passwords are hashed automatically by the pre-save hook on the User model
const seedUsers = async (departments) => {
    const [engineering, hr, finance, marketing, operations] = departments;

    const usersData = [
        // ── Admin ───────────────────────────────────────────────────────────────
        {
            name: "Super Admin",
            email: "admin@company.com",
            password: "Admin@123",
            role: "admin",
            department: hr._id,
            designation: "System Administrator",
        },

        // ── HR ───────────────────────────────────────────────────────────────────
        {
            name: "Priya Sharma",
            email: "priya.hr@company.com",
            password: "Hr@12345",
            role: "hr",
            department: hr._id,
            designation: "HR Manager",
        },

        // ── Managers ─────────────────────────────────────────────────────────────
        {
            name: "Rahul Mehta",
            email: "rahul.manager@company.com",
            password: "Manager@1",
            role: "manager",
            department: engineering._id,
            designation: "Engineering Manager",
        },
        {
            name: "Sneha Patel",
            email: "sneha.manager@company.com",
            password: "Manager@2",
            role: "manager",
            department: finance._id,
            designation: "Finance Manager",
        },
        {
            name: "Amit Joshi",
            email: "amit.manager@company.com",
            password: "Manager@3",
            role: "manager",
            department: marketing._id,
            designation: "Marketing Manager",
        },

        // ── Employees ────────────────────────────────────────────────────────────
        {
            name: "Jaydeep Popat",
            email: "jaydeep@company.com",
            password: "Emp@12345",
            role: "employee",
            department: engineering._id,
            designation: "Software Engineer",
        },
        {
            name: "Neha Gupta",
            email: "neha@company.com",
            password: "Emp@12345",
            role: "employee",
            department: engineering._id,
            designation: "Frontend Developer",
        },
        {
            name: "Rohan Das",
            email: "rohan@company.com",
            password: "Emp@12345",
            role: "employee",
            department: finance._id,
            designation: "Financial Analyst",
        },
        {
            name: "Kavya Nair",
            email: "kavya@company.com",
            password: "Emp@12345",
            role: "employee",
            department: marketing._id,
            designation: "Marketing Executive",
        },
        {
            name: "Vikram Singh",
            email: "vikram@company.com",
            password: "Emp@12345",
            role: "employee",
            department: operations._id,
            designation: "Operations Analyst",
        },
    ];

    // Use individual .save() so the pre-save bcrypt hook fires for each user
    const users = [];
    for (const data of usersData) {
        const user = new User(data);
        await user.save();
        users.push(user);
    }

    console.log(`✔  Users seeded (${users.length})`);
    return users;
};

// ─── Step 4 — Assign Managers to Departments ──────────────────────────────────
const assignManagers = async (departments, users) => {
    const [engineering, hr, finance, marketing, operations] = departments;

    const hrUser    = users.find((u) => u.email === "priya.hr@company.com");
    const engMgr    = users.find((u) => u.email === "rahul.manager@company.com");
    const finMgr    = users.find((u) => u.email === "sneha.manager@company.com");
    const mktMgr    = users.find((u) => u.email === "amit.manager@company.com");
    const admin     = users.find((u) => u.email === "admin@company.com");

    await Promise.all([
        Department.findByIdAndUpdate(engineering._id, { manager: engMgr._id }),
        Department.findByIdAndUpdate(hr._id,          { manager: hrUser._id }),
        Department.findByIdAndUpdate(finance._id,     { manager: finMgr._id }),
        Department.findByIdAndUpdate(marketing._id,   { manager: mktMgr._id }),
        Department.findByIdAndUpdate(operations._id,  { manager: admin._id }),
    ]);

    console.log("✔  Department managers assigned");
};

// ─── Step 5 — Leave Balances ──────────────────────────────────────────────────
// Allocate all leave types to all users for the current year
const seedLeaveBalances = async (users, leaveTypes) => {
    const year = new Date().getFullYear();
    const balances = [];

    for (const user of users) {
        for (const lt of leaveTypes) {
            balances.push({
                user: user._id,
                leaveType: lt._id,
                year,
                totalAllocated: lt.maxDaysPerYear,
                used: 0,
                remaining: lt.maxDaysPerYear,
            });
        }
    }

    await LeaveBalance.insertMany(balances);
    console.log(`✔  Leave balances seeded (${balances.length} records)`);
};

// ─── Step 6 — Sample Leave Requests ──────────────────────────────────────────
const seedLeaveRequests = async (users, leaveTypes) => {
    const year = new Date().getFullYear();

    const jaydeep  = users.find((u) => u.email === "jaydeep@company.com");
    const neha     = users.find((u) => u.email === "neha@company.com");
    const rohan    = users.find((u) => u.email === "rohan@company.com");
    const manager  = users.find((u) => u.email === "rahul.manager@company.com");

    const casual  = leaveTypes.find((lt) => lt.name === "Casual Leave");
    const sick    = leaveTypes.find((lt) => lt.name === "Sick Leave");
    const earned  = leaveTypes.find((lt) => lt.name === "Earned Leave");

    const requests = [
        // Pending request by jaydeep
        {
            employee: jaydeep._id,
            leaveType: casual._id,
            fromDate: new Date(`${year}-04-10`),
            toDate:   new Date(`${year}-04-12`),
            totalDays: 3,
            reason: "Family function",
            status: "pending",
            appliedAt: new Date(),
        },
        // Approved request by neha
        {
            employee: neha._id,
            leaveType: sick._id,
            fromDate: new Date(`${year}-03-05`),
            toDate:   new Date(`${year}-03-06`),
            totalDays: 2,
            reason: "Fever and doctor visit",
            status: "approved",
            approvedBy: manager._id,
            actionedAt: new Date(),
            appliedAt: new Date(`${year}-03-04`),
        },
        // Rejected request by rohan
        {
            employee: rohan._id,
            leaveType: earned._id,
            fromDate: new Date(`${year}-02-01`),
            toDate:   new Date(`${year}-02-05`),
            totalDays: 5,
            reason: "Personal travel",
            status: "rejected",
            approvedBy: manager._id,
            rejectionReason: "Critical month-end work — please reschedule",
            actionedAt: new Date(),
            appliedAt: new Date(`${year}-01-28`),
        },
    ];

    await LeaveRequest.insertMany(requests);

    // Deduct balance for the approved request
    await LeaveBalance.findOneAndUpdate(
        { user: neha._id, leaveType: sick._id, year },
        { $inc: { used: 2, remaining: -2 } }
    );

    console.log(`✔  Sample leave requests seeded (${requests.length})`);
};

// ─── Main ──────────────────────────────────────────────────────────────────────
const seed = async () => {
    const isFresh = process.argv.includes("--fresh");

    try {
        await connect();

        if (isFresh) {
            await clearAll();
        } else {
            // Skip if already seeded
            const existingUsers = await User.countDocuments();
            if (existingUsers > 0) {
                console.log(
                    `ℹ  Database already has ${existingUsers} user(s). ` +
                    `Run 'npm run seed:fresh' to wipe and re-seed.`
                );
                await disconnect();
                return;
            }
        }

        const leaveTypes  = await seedLeaveTypes();
        const departments = await seedDepartments();
        const users       = await seedUsers(departments);

        await assignManagers(departments, users);
        await seedLeaveBalances(users, leaveTypes);
        await seedLeaveRequests(users, leaveTypes);

        console.log("\n🎉  Seeding complete!\n");
        console.log("─── Default Login Credentials ───────────────────────────");
        console.log("  Admin    →  admin@company.com       / Admin@123");
        console.log("  HR       →  priya.hr@company.com    / Hr@12345");
        console.log("  Manager  →  rahul.manager@company.com / Manager@1");
        console.log("  Employee →  jaydeep@company.com     / Emp@12345");
        console.log("─────────────────────────────────────────────────────────\n");

        await disconnect();
    } catch (err) {
        console.error("✖  Seeding failed:", err.message);
        await disconnect();
        process.exit(1);
    }
};

seed();
