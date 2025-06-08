import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./LoginPage.css";
import { useAppContext } from "../../Context/AppContext";

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const navigate = useNavigate();
    const { login } = useAppContext();
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword((prevState) => !prevState);
    };

    const handleLogin = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await login(email, password);
            if (response.success) {
                navigate("/"); // Redirect to home on successful login
            } else {
                setError("Login failed. Please check your credentials.");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <form className="form" onSubmit={handleLogin}>
                <h1 className="login-title">Login</h1>
                <div className="inputForm">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input"
                        required
                    />
                </div>
                <div className="inputForm" style={{ position: "relative" }}>
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input"
                        required
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
                <div className="flex-row">
                    <a href="/reset-password" className="span">
                        Forgot password?
                    </a>
                </div>
                {error && <p className="error">{error}</p>}
                <button
                    type="submit"
                    className="button-submit"
                    disabled={loading}
                >
                    {loading ? "Logging in..." : "Login"}
                </button>
                <p className="p">
                    Don’t have an account yet?{" "}
                    <a href="/register" className="span">
                        Sign up
                    </a>
                </p>
            </form>
        </div>
    );
};

export default LoginPage;
