import mongoose, { Schema } from "mongoose";

const leaveRequestSchema = new Schema(
    {
        // Employee who submitted the leave request
        employee: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Employee reference is required"],
            index: true,
        },

        // Type of leave being requested
        leaveType: {
            type: Schema.Types.ObjectId,
            ref: "LeaveType",
            required: [true, "Leave type is required"],
            index: true,
        },

        // Start date of the leave
        fromDate: {
            type: Date,
            required: [true, "From date is required"],
        },

        // End date of the leave — must be >= fromDate (validated below)
        toDate: {
            type: Date,
            required: [true, "To date is required"],
        },

        // Total number of working/calendar days for this leave request
        totalDays: {
            type: Number,
            required: [true, "Total days is required"],
            min: [1, "Total days must be at least 1"],
        },

        // Reason provided by the employee for the leave
        reason: {
            type: String,
            required: [true, "Reason is required"],
            trim: true,
        },

        // Current status of the leave request
        status: {
            type: String,
            enum: ["pending", "approved", "rejected", "cancelled"],
            default: "pending",
            index: true,
        },

        // Manager/HR who approved or rejected the request
        approvedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },

        // Reason provided when a request is rejected
        rejectionReason: {
            type: String,
            trim: true,
        },

        // Timestamp when the leave request was submitted
        appliedAt: {
            type: Date,
            default: Date.now,
        },

        // Timestamp when the request was approved/rejected/cancelled
        actionedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Validation: toDate must be >= fromDate
leaveRequestSchema.pre("validate", function () {
    if (this.toDate && this.fromDate && this.toDate < this.fromDate) {
        this.invalidate("toDate", "toDate must be greater than or equal to fromDate");
    }
});

// Compound index: quickly fetch all leave requests for an employee filtered by status
leaveRequestSchema.index({ employee: 1, status: 1 });

// Compound index: query leave requests for an employee within a date range
leaveRequestSchema.index({ employee: 1, fromDate: 1 });

const LeaveRequest = mongoose.model("LeaveRequest", leaveRequestSchema);

export default LeaveRequest;
