import React, { useState, useRef } from "react";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";  
import { useNavigate } from "react-router-dom";
import "./ForgotPasswordpage.css";

type Props = {};

type EmailInput = {
  email: string;
};

type PasswordInput = {
  password: string;
  confirmPassword: string;
};

const emailValidation = Yup.object().shape({
  email: Yup.string().email("Invalid email address").required("Email is required*"),
});

const passwordValidation = Yup.object().shape({
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[^a-zA-Z0-9]/, "Password must contain at least one special character")
    .required("Password is required*"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm Password is required*"),
});


const ForgotPasswordPage = (props: Props) => {
  const navigate = useNavigate();

  const [step, setStep] = useState<"email" | "otp" | "changePassword" | "success">("email");
  const [userEmail, setUserEmail] = useState("");

  // Email form
  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors },
  } = useForm<EmailInput>({ resolver: yupResolver(emailValidation) });

  // OTP state
  const [otpValues, setOtpValues] = useState<string[]>(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password form for new password step
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordInput>({ resolver: yupResolver(passwordValidation) });

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtpValues = [...otpValues];
    newOtpValues[index] = value.slice(-1);
    setOtpValues(newOtpValues);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const onSendOtp = (data: EmailInput) => {
    console.log("Sending OTP to:", data.email);
    setUserEmail(data.email);
    // TODO: Call API to send OTP
    setStep("otp");
  };

  const onVerifyOtp = () => {
    const otp = otpValues.join("");
    if (otp.length < 6) {
      alert("Please enter all 6 digits of OTP");
      return;
    }
    console.log("Verifying OTP:", otp, "for email:", userEmail);
    // TODO: Call API to verify OTP
    setStep("changePassword");  // <-- go to password step instead of success
  };

  const onChangePassword = (data: PasswordInput) => {
    console.log("Changing password for", userEmail, data.password);
    // TODO: Call API to change password

    // On success:
    setStep("success");
  };

  const onOk = () => {
    alert("Password changed successfully! You can now log in.");
    navigate("/login");
  };

  return (
    <div className="form-container">
      {step === "email" && (
        <form className="form" onSubmit={handleSubmitEmail(onSendOtp)}>
          <h1 className="reset-title">Forgot Password</h1>
          <label className="flex-column">E-mail</label>
          <div className="inputForm">
            <input
              type="email"
              placeholder="Enter your email"
              {...registerEmail("email")}
              className="input"
            />
          </div>
          {emailErrors.email && <p className="error">{emailErrors.email.message}</p>}
          <button type="submit" className="button-submit">
            Get OTP
          </button>
          <p className="p auth-links">
            <a href="/register" className="auth-link">
              Sign up
            </a>
            {" | "}
            <a href="/login" className="auth-link">
              Login
            </a>
          </p>
        </form>
      )}

      {step === "otp" && (
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            onVerifyOtp();
          }}
        >
          <h1 className="reset-title">Enter OTP</h1>
          <p className="p">
            We sent an OTP to <strong>{userEmail}</strong>
          </p>
          <label className="flex-column">OTP</label>
          <div className="otp-container">
            {otpValues.map((value, i) => (
              <input
                key={i}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className="otp-input"
                value={value}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                ref={(el) => (otpRefs.current[i] = el)}
                autoFocus={i === 0}
              />
            ))}
          </div>
          <button type="submit" className="button-submit">
            Verify
          </button>
        </form>
      )}

      {step === "changePassword" && (
        <form className="form" onSubmit={handleSubmitPassword(onChangePassword)}>
          <h1 className="reset-title">Change Password</h1>
          <label className="flex-column">New Password</label>
          <div className="inputForm">
            <input
              type="password"
              placeholder="Enter new password"
              {...registerPassword("password")}
              className="input"
            />
          </div>
          {passwordErrors.password && <p className="error">{passwordErrors.password.message}</p>}

          <label className="flex-column">Confirm Password</label>
          <div className="inputForm">
            <input
              type="password"
              placeholder="Confirm new password"
              {...registerPassword("confirmPassword")}
              className="input"
            />
          </div>
          {passwordErrors.confirmPassword && <p className="error">{passwordErrors.confirmPassword.message}</p>}

          <button type="submit" className="button-submit">
            Change Password
          </button>
        </form>
      )}

      {step === "success" && (
        <div className="form">
          <h1 className="reset-title">Success!</h1>
          <p className="p">Your password has been changed successfully.</p>
          <button onClick={onOk} className="button-submit">
            Okay
          </button>
        </div>
      )}
    </div>
  );
};

export default ForgotPasswordPage;
