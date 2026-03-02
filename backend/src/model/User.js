import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
    {
        // Full name of the user
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
        },

        // Unique email used for login and identification
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },

        // Hashed password — excluded from query results by default
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters"],
            select: false,
        },

        // Role determines access level and permissions
        role: {
            type: String,
            enum: ["employee", "manager", "hr", "admin"],
            default: "employee",
            index: true,
        },

        // Reference to the department the user belongs to
        department: {
            type: Schema.Types.ObjectId,
            ref: "Department",
            required: [true, "Department is required"],
            index: true,
        },

        // Job title or position of the user
        designation: {
            type: String,
            required: [true, "Designation is required"],
            trim: true,
        },

        // Soft status — inactive users cannot log in
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
            index: true,
        },

        // Single refresh token — overwritten on each login, cleared on logout
        refreshToken: {
            type: String,
            default: null,
            select: false,
        },

    },
    {
        timestamps: true,
    }
);

// Compound index for filtering active users by role
userSchema.index({ role: 1, status: 1 });

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            name: this.name,
            role: this.role,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
};
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    );
};

const User = mongoose.model("User", userSchema);

export default User;
