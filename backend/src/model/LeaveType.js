import mongoose, { Schema } from "mongoose";

const leaveTypeSchema = new Schema(
    {
        // Name of the leave type (e.g., Casual Leave, Sick Leave, Earned Leave)
        name: {
            type: String,
            required: [true, "Leave type name is required"],
            unique: true,
            trim: true,
            index: true,
        },

        // Maximum number of days an employee can take per year for this leave type
        maxDaysPerYear: {
            type: Number,
            required: [true, "Max days per year is required"],
            min: [1, "Max days must be at least 1"],
        },

        // Whether unused leaves of this type can be carried forward to the next year
        carryForwardAllowed: {
            type: Boolean,
            default: false,
        },

        // Optional description or policy note for this leave type
        description: {
            type: String,
            trim: true,
        },

        // Allows HR/admin to deactivate a leave type without deleting it
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

const LeaveType = mongoose.model("LeaveType", leaveTypeSchema);

export default LeaveType;
