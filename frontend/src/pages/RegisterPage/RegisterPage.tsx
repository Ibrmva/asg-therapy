import React, { useState, useRef } from "react";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useAppContext } from "../../Context/AppContext";
import { useForm } from "react-hook-form";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./RegisterPage.css";

type RegisterFormsInputs = {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const validationSchema = Yup.object().shape({
  firstname: Yup.string().required("First Name is required"),
  lastname: Yup.string().required("Last Name is required"),
  email: Yup.string().email("Invalid email format").required("Email is required"),
  password: Yup.string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter (A-Z)")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter (a-z)")
    .matches(/[0-9]/, "Password must contain at least one number (0-9)")
    .matches(/[@$!%*?&#.]/, "Password must contain at least one special character (@$!%*?&#)"),
  confirmPassword: Yup.string()
    .required("Confirm Password is required")
    .oneOf([Yup.ref("password")], "Passwords must match"),
});

const OTP_LENGTH = 6;

const RegisterPage = () => {
  const { registerUser, verifyOtp } = useAppContext();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormsInputs>({ resolver: yupResolver(validationSchema) });

  const [step, setStep] = useState<"register" | "otp">("register");
  const [userEmail, setUserEmail] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpValues, setOtpValues] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword((prev) => !prev);

  const handleRegister = async (form: RegisterFormsInputs) => {
    setLoading(true);
    try {
      await registerUser(
        form.firstname,
        form.lastname,
        form.email,
        form.password,
        form.confirmPassword
      );
      setUserEmail(form.email);
      setStep("otp");
    } catch (error) {
      console.error(error);
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
    alert("Please enter the complete OTP");
    return;
  }

  setLoading(true);
  try {
    const verificationResult = await verifyOtp(userEmail, otp);
    if (verificationResult?.success) {
      navigate("/"); // Redirect to home after successful verification
    } else {
      // If verification fails, reset the form and go back to registration
      setOtpValues(Array(OTP_LENGTH).fill(""));
      setStep("register");
      alert("OTP verification failed. Please register again.");
    }
  } catch (error) {
    console.error(error);
    setOtpValues(Array(OTP_LENGTH).fill(""));
    setStep("register");
    alert("OTP verification failed. Please register again.");
  } finally {
    setLoading(false);
  }
};

  return (
    <section className="bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
        <div className="w-full bg-white rounded-lg shadow dark:border md:mb-20 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">

            {step === "register" && (
              <>
                <h1 className="register-title">Create an account</h1>
                <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit(handleRegister)}>
                  {/* First Name */}
                  <div>
                    <label
                      htmlFor="firstname"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstname"
                      className="input-field"
                      placeholder="First Name"
                      {...register("firstname")}
                    />
                    {errors.firstname && (
                      <p className="error-text">{errors.firstname.message}</p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div>
                    <label
                      htmlFor="lastname"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastname"
                      className="input-field"
                      placeholder="Last Name"
                      {...register("lastname")}
                    />
                    {errors.lastname && (
                      <p className="error-text">{errors.lastname.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      className="input-field"
                      placeholder="Email"
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="error-text">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label
                      htmlFor="password"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Create Password
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        className="input-field"
                        placeholder="••••••••"
                        {...register("password")}
                        style={{ paddingRight: "2.5rem" }}
                      />
                      <span
                        onClick={togglePasswordVisibility}
                        style={{
                          position: "absolute",
                          right: "0.75rem",
                          top: "50%",
                          transform: "translateY(-50%)",
                          cursor: "pointer",
                          color: "#6b7280",
                        }}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") togglePasswordVisibility();
                        }}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </span>
                    </div>
                    {errors.password && (
                      <p className="error-text">{errors.password.message}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Confirm Password
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        className="input-field"
                        placeholder="••••••••"
                        {...register("confirmPassword")}
                        style={{ paddingRight: "2.5rem" }}
                      />
                      <span
                        onClick={toggleConfirmPasswordVisibility}
                        style={{
                          position: "absolute",
                          right: "0.75rem",
                          top: "50%",
                          transform: "translateY(-50%)",
                          cursor: "pointer",
                          color: "#6b7280",
                        }}
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") toggleConfirmPasswordVisibility();
                        }}
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </span>
                    </div>
                    {errors.confirmPassword && (
                      <p className="error-text">{errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="submit-button"
                    disabled={loading}
                  >
                    {loading ? "Registering..." : "Register"}
                  </button>

                  <p className="text-sm font-light text-gray-500 dark:text-gray-400">
                    Already have an account?{" "}
                    <a
                      href="/login"
                      className="font-medium text-primary-600 hover:underline dark:text-primary-500"
                    >
                      Sign in
                    </a>
                  </p>
                </form>
              </>
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
                <button type="submit" className="button-submit" disabled={loading}>
                  {loading ? "Verifying..." : "Verify"}
                </button>
              </form>
            )}

          </div>
        </div>
      </div>
    </section>
  );
};

export default RegisterPage;

