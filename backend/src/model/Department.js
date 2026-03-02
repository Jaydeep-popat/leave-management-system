import mongoose, { Schema } from "mongoose";

const departmentSchema = new Schema(
    {
        // Department name must be unique across the organization
        name: {
            type: String,
            required: [true, "Department name is required"],
            unique: true,
            trim: true,
            index: true,
        },

        // Optional description for the department
        description: {
            type: String,
            trim: true,
        },

        // Reference to the user who manages this department
        manager: {
            type: Schema.Types.ObjectId,
            ref: "User",
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

const Department = mongoose.model("Department", departmentSchema);

export default Department;
