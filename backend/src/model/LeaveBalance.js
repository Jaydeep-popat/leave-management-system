import mongoose, { Schema } from "mongoose";

const leaveBalanceSchema = new Schema(
    {
        // Employee whose balance is being tracked
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User reference is required"],
            index: true,
        },

        // Leave type for which the balance is tracked
        leaveType: {
            type: Schema.Types.ObjectId,
            ref: "LeaveType",
            required: [true, "Leave type reference is required"],
            index: true,
        },

        // Calendar year for this balance record (e.g., 2025)
        year: {
            type: Number,
            required: [true, "Year is required"],
            index: true,
        },

        // Total leaves allocated for this leave type in the given year
        totalAllocated: {
            type: Number,
            required: [true, "Total allocated days is required"],
            min: [0, "Total allocated cannot be negative"],
        },

        // Number of leave days already consumed by the employee
        used: {
            type: Number,
            default: 0,
            min: [0, "Used days cannot be negative"],
        },

        // remaining = totalAllocated - used
        // This field should be kept in sync whenever 'used' is updated
        remaining: {
            type: Number,
            required: [true, "Remaining days is required"],
            min: [0, "Remaining days cannot be negative"],
        },
    },
    {
        timestamps: true,
    }
);

// Compound unique index: one balance record per user per leave type per year
leaveBalanceSchema.index({ user: 1, leaveType: 1, year: 1 }, { unique: true });

const LeaveBalance = mongoose.model("LeaveBalance", leaveBalanceSchema);

export default LeaveBalance;
