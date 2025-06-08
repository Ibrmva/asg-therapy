import React, { useState, useRef } from "react";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useAppContext } from "../../Context/AppContext";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./ForgotPasswordpage.css";
import axios from "axios";
import e from "express";



type ForgotPasswordInputs = {
  email: string;
};

type FormStep = "email" | "otp" | "reset";

const validationSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email format").required("Email is required"),
});

const OTP_LENGTH = 6;
const PASSWORD_MIN_LENGTH = 8;

const ForgotPassword = () => {
  const { sendPasswordResetOtp, verifyPasswordResetOtp, resetPassword } = useAppContext();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInputs>({ resolver: yupResolver(validationSchema) });

  const [step, setStep] = useState<FormStep>("email");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpValues, setOtpValues] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentError, setCurrentError] = useState<string | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword((prev) => !prev);

  const handleSendOtp = async (form: ForgotPasswordInputs) => {
    setLoading(true);
    try {
      await sendPasswordResetOtp(form.email);
      setUserEmail(form.email);
      setStep("otp");
    } catch (error) {
      console.error("Error sending OTP:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtpValues = [...otpValues];
    newOtpValues[index] = value.slice(-1);
    setOtpValues(newOtpValues);

    if (value && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      const newOtpValues = [...otpValues];
      newOtpValues[index - 1] = "";
      setOtpValues(newOtpValues);
      otpRefs.current[index - 1]?.focus();
    }
  };

  const onVerifyOtp = async () => {
    const otp = otpValues.join("");
    if (otp.length < OTP_LENGTH) {
      setCurrentError("Please enter the complete OTP");
      return;
    }

    setLoading(true);
    try {
      const verificationResult = await verifyPasswordResetOtp(userEmail, otp);
      if (verificationResult?.success) {
        setStep("reset");
      } else {
        setOtpValues(Array(OTP_LENGTH).fill(""));
        setCurrentError("Invalid OTP. Please try again.");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      setOtpValues(Array(OTP_LENGTH).fill(""));
      setCurrentError("Error verifying OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setCurrentError(null);

    if (newPassword !== confirmNewPassword) {
      setCurrentError("Passwords don't match");
      return;
    }

    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      setCurrentError("Password must be at least 8 characters");
      return;
    }

    if (!/[a-z]/.test(newPassword)) {
      setCurrentError("Password must contain at least one lowercase letter");
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      setCurrentError("Password must contain at least one uppercase letter");
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      setCurrentError("Password must contain at least one number");
      return;
    }

    if (!/[^a-zA-Z0-9]/.test(newPassword)) {
      setCurrentError("Password must contain at least one special character");
      return;
    }

    setLoading(true);
      try {
          const otp = otpValues.join("");
          const result = await resetPassword(userEmail, otp, newPassword);
          
          if (result.success) {
            navigate("/login");
          } else {
            setCurrentError("Failed to reset password. Please try again.");
          }
        } catch (error) {
          console.error("Error resetting password:", error);
          setCurrentError("Failed to reset password. Please try again.");
        } finally {
          setLoading(false);
        } 
  };

  return (
    <div className="forgot-password-container">
      {step === "email" && (
        <form className="forgot-password-form" onSubmit={handleSubmit(handleSendOtp)}>
          <h1 className="forgot-password-title">Forgot Password</h1>
          
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              id="email"
              className={`form-input ${errors.email ? "input-error" : ""}`}
              placeholder="your@email.com"
              {...register("email")}
              aria-invalid={!!errors.email}
              aria-describedby="email-error"
            />
            {/* {errors.email && (
              <p id="email-error" className="error-message">
                {errors.email.message}
              </p>
            )} */}
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>

          <p className="form-footer">
            Remember your password?{" "}
            <a href="/login" className="form-link">
              Sign in
            </a>
          </p>
        </form>
      )}

      {step === "otp" && (
        <form
          className="forgot-password-form"
          onSubmit={(e) => {
            e.preventDefault();
            onVerifyOtp();
          }}
        >
          <h1 className="forgot-password-title">Enter OTP</h1>
          <p className="form-description">
            We sent an OTP to <strong>{userEmail}</strong>
          </p>
          
          {/* {currentError && (
            <div className="error-message" style={{ marginBottom: '1rem' }}>
              {currentError}
            </div>
          )} */}
          
          <div className="form-group">
            <label className="form-label">OTP Code</label>
            <div className="otp-container">
              {otpValues.map((value, i) => (
                <input
                  key={i}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className={`otp-input ${value ? "has-value" : ""}`}
                  value={value}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  ref={(el) => (otpRefs.current[i] = el)}
                  autoFocus={i === 0}
                  aria-label={`Digit ${i + 1} of OTP code`}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
      )}

      {step === "reset" && (
        <div className="forgot-password-form">
          <h1 className="forgot-password-title">Reset Password</h1>
          <p className="form-description">
            Enter your new password for <strong>{userEmail}</strong>
          </p>
          
          {/* {currentError && (
            <div className="error-message" style={{ marginBottom: '1rem' }}>
              {currentError}
            </div>
          )} */}

          <div className="form-group">
            <label htmlFor="newPassword" className="form-label">
              New Password
            </label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="newPassword"
                className={`form-input ${currentError ? "input-error" : ""}`}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmNewPassword" className="form-label">
              Confirm New Password
            </label>
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmNewPassword"
                className={`form-input ${currentError ? "input-error" : ""}`}
                placeholder="Confirm new password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={toggleConfirmPasswordVisibility}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="password-requirements">
            <p>Password must contain:</p>
            <ul>
              <li className={newPassword.length >= PASSWORD_MIN_LENGTH ? "valid" : ""}>
                At least 8 characters
              </li>
              <li className={/[a-z]/.test(newPassword) ? "valid" : ""}>
                One lowercase letter
              </li>
              <li className={/[A-Z]/.test(newPassword) ? "valid" : ""}>
                One uppercase letter
              </li>
              <li className={/[0-9]/.test(newPassword) ? "valid" : ""}>
                One number
              </li>
              <li className={/[^a-zA-Z0-9]/.test(newPassword) ? "valid" : ""}>
                One special character
              </li>
              <li className={newPassword === confirmNewPassword && newPassword.length > 0 ? "valid" : ""}>
                Passwords match
              </li>
            </ul>
          </div>

          <button
            type="button"
            className="submit-button"
            onClick={handlePasswordReset}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ForgotPassword;