import cookieParser from "cookie-parser";
import userModel from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import transporter from "../config/nodemailer.js";


// Temporary storage for unverified users
const tempUsers = new Map();

export const register = async (req, res) => {
    const { firstname, lastname, email, password, confirmPassword } = req.body;

    if (!firstname || !lastname || !email || !password || !confirmPassword) {
        return res.status(400).json({ 
            success: false, 
            message: 'All fields are required',
            error: "MISSING_FIELDS"
        });
    }

    if(password !== confirmPassword) {
        return res.status(400).json({
            success: false,
            message: "Passwords do not match",
            error: "PASSWORD_MISMATCH"
        });
    }

    try {
        // Check if email is already registered (permanent user)
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ 
                success: false, 
                message: 'User already exists',
                error: "USER_EXISTS"
            });
        }

        // Check if email is in temporary storage (pending verification)
        if (tempUsers.has(email)) {
            return res.status(409).json({ 
                success: false, 
                message: 'Verification already pending for this email',
                error: "VERIFICATION_PENDING"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const otpExpiry = Date.now() + 30 * 60 * 1000; // 30 mins

        // Store user data temporarily
        tempUsers.set(email, {
            firstname,
            lastname,
            email,
            password: hashedPassword,
            otp,
            otpExpiry
        });

        // Send OTP email
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'Welcome to ASG THERAPY - Verify Your Email',
            text: `Hello ${firstname},\n\nThank you for registering on ASG Therapy.\nYour OTP for account verification is: ${otp}\n\nPlease use this OTP to verify your account.`
        };

        await transporter.sendMail(mailOptions);

        return res.json({ 
            success: true,
            message: 'OTP sent to your email. Please verify to complete registration.',
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};






export const verifyEmail = async (req, res) => {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
        return res.status(400).json({ 
            success: false, 
            message: "Email and OTP are required",
            error: "MISSING_FIELDS"
        });
    }

    try {
        const tempUser = tempUsers.get(email);
        if (!tempUser) {
            return res.status(404).json({ 
                success: false, 
                message: "No pending registration found",
                error: "NO_PENDING_REGISTRATION"
            });
        }

        if (tempUser.otp !== otp) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid OTP",
                error: "INVALID_OTP"
            });
        }

        if (tempUser.otpExpiry < Date.now()) {
            tempUsers.delete(email);
            return res.status(400).json({ 
                success: false, 
                message: "OTP expired",
                error: "OTP_EXPIRED"
            });
        }

        // Create the actual user
        const user = new userModel({
            firstname: tempUser.firstname,
            lastname: tempUser.lastname,
            email: tempUser.email,
            password: tempUser.password,
            isAccountVerified: true,
        });

        const savedUser = await user.save();
        tempUsers.delete(email);

        if (!savedUser) {
            throw new Error("Failed to create user");
        }

        const token = jwt.sign({ id: savedUser._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

        return res.status(201).json({
            success: true,
            message: "Account verified and created successfully",
            token,
            userData: {
                id: savedUser._id,
                firstname: savedUser.firstname,
                lastname: savedUser.lastname,
                email: savedUser.email,
            },
        });

    } catch (error) {
        // Clean up if something went wrong
        if (tempUsers.has(email)) {
            tempUsers.delete(email);
        }
        return res.status(500).json({ 
            success: false, 
            message: error.message || "Unable to complete verification",
            error: "VERIFICATION_FAILED"
        });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
         return res.json({ success: false, message: 'All fields are required' });
    }

    try {
        const user = await userModel.findOne({ email });
        if (!user) {
             return res.json({ success: false, message: 'Invalid email' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.json({ success: false, message: 'Invalid password' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.json({
            success: true,
            token,
            user: {
                id: user._id,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email
            }
        });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        });
        return res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        return res.json({ success: false, message: 'Error logging out' });
    }
};

// send verification OTP to user email
export const sendVerifyOtp = async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await userModel.findById(userId);

        if (user.isAccountVerified) {
            return res.json({ success: false, message: 'Account already verified' });
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));

        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now() + 1 * 60 * 60 * 1000; // 1 hour

        await user.save();

        const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Account Verification OTP',
            text: `Your OTP is ${otp}. Verify your account using this OTP.`
        };

        await transporter.sendMail(mailOption);
        res.json({ success: true, message: 'Verification OTP sent on Email' });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};



// check if user is authenticated
export const isAuthenticated = async (req, res) => {
    try {
        return res.json({ success: true });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// send password reset OTP to user email
// export const sendResetOtp = async (req, res) => {
//     const { email } = req.body;

//     if (!email) {
//         return res.status(400).json({ 
//             success: false, 
//             message: "Email is required",
//             error: "MISSING_EMAIL"
//         });
//     }

//     try {
//         const user = await userModel.findOne({ email });
//         if (!user) {
//             return res.status(404).json({ 
//                 success: false, 
//                 message: "User not found",
//                 error: "USER_NOT_FOUND"
//             });
//         }

//         // Generate 6-digit OTP
//         const otp = String(Math.floor(100000 + Math.random() * 900000));
//         const otpExpiry = Date.now() + 30 * 60 * 1000; // 30 minutes expiry

//         // Save OTP to user document
//         user.resetOtp = otp;
//         user.resetOtpExpireAt = otpExpiry;
//         await user.save();

//         // Send email with OTP
//         const mailOptions = {
//             from: process.env.SENDER_EMAIL,
//             to: email,
//             subject: 'ASG THERAPY - Password Reset OTP',
//             text: `Hello ${user.firstname},\n\nYour password reset OTP is: ${otp}\n\nThis OTP will expire in 30 minutes.`,
//             html: `
//                 <div>
//                     <h3>ASG THERAPY - Password Reset</h3>
//                     <p>Hello ${user.firstname},</p>
//                     <p>Your password reset OTP is: <strong>${otp}</strong></p>
//                     <p>This OTP will expire in 30 minutes.</p>
//                     <p>If you didn't request this, please ignore this email.</p>
//                 </div>
//             `
//         };

//         await transporter.sendMail(mailOptions);

//         return res.json({ 
//             success: true,
//             message: "Password reset OTP sent to your email",
//         });

//     } catch (error) {
//         return res.status(500).json({ 
//             success: false, 
//             message: error.message,
//             error: "SERVER_ERROR"
//         });
//     }
// };

export const sendResetOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ 
      success: false, 
      message: "Email is required",
      error: "MISSING_EMAIL"
    });
  }

  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found",
        error: "USER_NOT_FOUND"
      });
    }

    // Generate OTP (6 digits)
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpiry = Date.now() + 30 * 60 * 1000; // 30 minutes expiry

    // Save OTP to user
    user.resetOtp = otp;
    user.resetOtpExpireAt = otpExpiry;
    await user.save();

    // Send email
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: 'ASG THERAPY - Password Reset OTP',
      text: `Your OTP is ${otp}. It will expire in 30 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    return res.json({ 
      success: true,
      message: "Password reset OTP sent to your email",
    });

  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: error.message,
      error: "SERVER_ERROR"
    });
  }
};
/**
 * @desc    Verify reset OTP and update password
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    // Validate input
    if (!email || !otp || !newPassword) {
        return res.status(400).json({ 
            success: false, 
            message: "All fields are required",
            error: "MISSING_FIELDS"
        });
    }

    try {
        // Find user by email
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found",
                error: "USER_NOT_FOUND"
            });
        }


        // Check if OTP matches and is not expired
        if (user.resetOtp !== otp) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid OTP",
                error: "INVALID_OTP"
            });
        }


        if (user.resetOtpExpireAt < Date.now()) {
            return res.status(400).json({ 
                success: false, 
                message: "OTP expired",
                error: "OTP_EXPIRED"
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // Update password and clear OTP fields
        user.resetOtp = undefined; // Clear OTP
        user.resetOtpExpireAt = undefined; // Clear OTP expiry
        await user.save();


        // Send confirmation email
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'ASG THERAPY - Password Changed Successfully',
            text: `Hello ${user.firstname},\n\nYour password has been successfully changed.\n\nIf you didn't make this change, please contact us immediately.`,
            html: `
                <div>
                    <h3>Password Changed Successfully</h3>
                    <p>Hello ${user.firstname},</p>
                    <p>Your password has been successfully changed.</p>
                    <p>If you didn't make this change, please contact us immediately.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        return res.json({ 
            success: true,
            message: "Password updated successfully",
            token,
            user: {
                id: user._id,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email
            }
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message,
            error: "SERVER_ERROR"
        });
    }
};

/**
 * @desc    Resend password reset OTP
 * @route   POST /api/auth/resend-reset-otp
 * @access  Public
 */

// Add this to your authController.js
export const verifyResetOtp = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ 
            success: false, 
            message: "Email and OTP are required",
            error: "MISSING_FIELDS"
        });
    }

    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found",
                error: "USER_NOT_FOUND"
            });
        }

        // Check if OTP matches and is not expired
        if (!user.resetOtp || user.resetOtp !== otp) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid OTP",
                error: "INVALID_OTP"
            });
        }

        if (user.resetOtpExpireAt < Date.now()) {
            return res.status(400).json({ 
                success: false, 
                message: "OTP has expired",
                error: "OTP_EXPIRED"
            });
        }

        return res.json({ 
            success: true,
            message: "OTP verified successfully",
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message,
            error: "SERVER_ERROR"
        });
    }
};

export const verifyPasswordResetOtp = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ 
            success: false, 
            message: "Email and OTP are required",
            error: "MISSING_FIELDS"
        });
    }

    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found",
                error: "USER_NOT_FOUND"
            });
        }

        // Check if OTP matches and is not expired
        if (!user.resetOtp || user.resetOtp !== otp) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid OTP",
                error: "INVALID_OTP"
            });
        }

        if (user.resetOtpExpireAt < Date.now()) {
            return res.status(400).json({ 
                success: false, 
                message: "OTP has expired",
                error: "OTP_EXPIRED"
            });
        }

        return res.json({ 
            success: true,
            message: "OTP verified successfully",
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message,
            error: "SERVER_ERROR"
        });
    }
};
export const resendResetOtp = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ 
            success: false, 
            message: "Email is required",
            error: "MISSING_EMAIL"
        });
    }

    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found",
                error: "USER_NOT_FOUND"
            });
        }

        // Generate new OTP
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const otpExpiry = Date.now() + 30 * 60 * 1000; // 30 minutes expiry

        // Update OTP fields
        user.resetOtp = otp;
        user.resetOtpExpireAt = otpExpiry;
        await user.save();

        // Send email with new OTP
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'ASG THERAPY - New Password Reset OTP',
            text: `Hello ${user.firstname},\n\nYour new password reset OTP is: ${otp}\n\nThis OTP will expire in 30 minutes.`,
        };

        await transporter.sendMail(mailOptions);

        return res.json({ 
            success: true,
            message: "New password reset OTP sent to your email",
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message,
            error: "SERVER_ERROR"
        });
    }
};

