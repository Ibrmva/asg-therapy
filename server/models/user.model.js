// import mongoose from "mongoose";

// const userSchema = new mongoose.Schema(
// 	{
// 		firstname: {
// 			type: String,
// 			required: true,
// 		},

// 		lastname: {
// 			type: String,
// 			required: true,
// 		},

// 		email: {
// 			type: String,
// 			required: true,
// 			unique: true,
// 		},

// 		password: {
// 			type: String,
// 			required: true,
// 		},

// 		confirmPassword: {
// 			type: String,
// 			required: true,
// 		},

// 		lastLogin: {
// 			type: Date,
// 			default: Date.now,
// 		},
// 		isVerified: {
// 			type: Boolean,
// 			default: false,
// 		},
// 		resetPasswordToken: String,
// 		resetPasswordExpiresAt: Date,
// 		verificationToken: String,
// 		verificationTokenExpiresAt: Date,
// 	},
// 	{ timestamps: true }
// );

// export const User = mongoose.model("User", userSchema);
