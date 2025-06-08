import React, { createContext, ReactNode, useContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

interface UserData {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
}

interface AuthContextType {
  backendUrl: string;
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  userData: UserData | null;
  setUserData: React.Dispatch<React.SetStateAction<UserData | null>>;
  registerUser: (
    firstname: string,
    lastname: string,
    email: string,
    password: string,
    confirmPassword: string
  ) => Promise<{ success: boolean }>;
  getAuthState: () => Promise<void>;
  getUserData: () => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<{ success: boolean }>;       // new
  resendOtp: (email: string) => Promise<void>;                    // new

  sendPasswordResetOtp: (email: string) => Promise<{ success: boolean }>;
  verifyPasswordResetOtp: (email: string, otp: string) => Promise<{ success: boolean }>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<{ success: boolean }>;
  otpSent: boolean;                                               // new (optional)
  pendingEmail: string | null;                                    // new (optional)
  login: (email: string, password: string) => Promise<{ success: boolean }>;
}


const AppContext = createContext<AuthContextType | undefined>(undefined);

interface AppContextProviderProps {
  children: ReactNode;
}

export const AppContextProvider: React.FC<AppContextProviderProps> = ({ children }) => {
  const backendUrl =
    import.meta.env.MODE === "development"
      ? "http://localhost:4000/api/auth"
      : import.meta.env.VITE_BACKEND_URL.replace(/\/+$/, "");

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  const [otpSent, setOtpSent] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  

  const getAuthState = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/is-auth`);
      if (data.success) {
        setIsLoggedIn(true);
        await getUserData();
      } else {
        throw new Error(data.message || "Not authenticated");
      }
    } catch (error: any) {
      localStorage.removeItem("token");
      setIsLoggedIn(false);
      setUserData(null);
      throw error;
    }
  };

  const getUserData = async (suppressErrors = false): Promise<void> => {
    try {
      const { data } = await axios.get(`${backendUrl}/user/data`);
      if (data.success) {
        setUserData(data.user); // Make sure this matches your backend response
      } else {
        if (!suppressErrors) {
          toast.error(data.message);
        }
      }
    } catch (error: any) {
      if (!suppressErrors) {
        toast.error(error.response?.data?.message || "Unable to fetch user data.");
      }
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      getAuthState().catch(error => {
        console.error("Initial auth check failed:", error);
        localStorage.removeItem("token");
      });
    } else {
      setIsLoggedIn(false);
      setUserData(null);
    }
  }, []);

  const registerUser = async (
    firstname: string,
    lastname: string,
    email: string,
    password: string,
    confirmPassword: string
  ) => {
    try {
      const { data } = await axios.post(`${backendUrl}/register`, {
        firstname,
        lastname,
        email,
        password,
        confirmPassword,
      });

      if (data.success) {
        setOtpSent(true);
        setPendingEmail(email);
        return { success: true };
      } else {
        toast.error(data.message || "Registration failed, please try again.");
        return { success: false };
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Registration error occurred.");
      return { success: false };
    }
  };

const verifyOtp = async (email: string, otp: string) => {
  try {
    const { data } = await axios.post(`${backendUrl}/verify-email`, { email, otp });
    if (data.success && data.token) {
      localStorage.setItem("token", data.token);
      setIsLoggedIn(true);
      axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
      
      // Silent user data fetch (no error toast on failure)
      await getUserData(true); // Passing true to suppress errors
      
      setOtpSent(false);
      setPendingEmail(null);
      toast.success("Email verified successfully! You are now logged in.");
      return { success: true };
    } else {
      toast.error(data.message || "OTP verification failed. Please try again.");
      return { success: false };
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || "OTP verification error.");
    return { success: false };
  }
};


const resendOtp = async (email: string) => {
  try {
    const { data } = await axios.post(`${backendUrl}/resend-otp`, { email });
    if (data.success) {
      toast.success("OTP resent successfully!");
    } else {
      toast.error(data.message || "Failed to resend OTP.");
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error resending OTP.");
  }
};

  const sendPasswordResetOtp = async (email: string) => {
    try {
      console.log("Sending OTP to:", email);
      const { data } = await axios.post(`${backendUrl}/send-reset-otp`, { email });
      console.log("OTP Response:", data);
      
      if (data.success) {
        setPendingEmail(email);
        toast.success("Password reset OTP sent successfully!");
        return { success: true };
      } else {
        toast.error(data.message || "Failed to send OTP");
        return { success: false };
      }
    } catch (error: any) {
      console.error("OTP Error:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Error sending OTP");
      return { success: false };
    }
  };

  const resendPasswordResetOtp = async (email: string) => {
  try {
    const { data } = await axios.post(`${backendUrl}/resend-reset-otp`, { email });
    if (data.success) {
      toast.success("New OTP sent successfully!");
      return { success: true };
    } else {
      toast.error(data.message || "Failed to resend OTP");
      return { success: false };
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error resending OTP");
    return { success: false };
  }
};

// In your AppContext.tsx, update the verifyPasswordResetOtp function:
const verifyPasswordResetOtp = async (email: string, otp: string) => {
  try {
    const { data } = await axios.post(`${backendUrl}/verify-reset-otp`, { 
      email, 
      otp
    });

    if (data.success) {
      toast.success("OTP verified successfully!");
      return { success: true };
    } else {
      toast.error(data.message || "Invalid OTP");
      return { success: false };
    }
  } catch (error: any) {
    toast.error(
      error.response?.data?.message || 
      "Error verifying OTP. Please check the code and try again."
    );
    return { success: false };
  }
};


  const resetPassword = async (email: string, otp: string, newPassword: string) => {
    try {
      const { data } = await axios.post(`${backendUrl}/reset-password`, { 
        email, 
        otp,
        newPassword 
      });
      if (data.success) {
        toast.success("Password reset successfully!");
        return { success: true };
      } else {
        toast.error(data.message || "Failed to reset password");
        return { success: false };
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error resetting password");
      return { success: false };
    }
  };

  const login = async (email: string, password: string) => {
  try {
    const { data } = await axios.post(`${backendUrl}/login`, { email, password });

    if (data.success && data.token) {
      localStorage.setItem("token", data.token);
      setIsLoggedIn(true);
      axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
      
      await getUserData(true); // Silent user data fetch
      toast.success("Login successful!");
      return { success: true };
    } else {
      toast.error(data.message || "Login failed. Please check your credentials.");
      return { success: false };
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Login error occurred.");
    return { success: false };
  }
};





const value: AuthContextType = {
  backendUrl,
  isLoggedIn,
  setIsLoggedIn,
  userData,
  setUserData,
  registerUser,
  getAuthState,
  getUserData,
  verifyOtp,        // <-- added
  resendOtp,        // <-- added
  otpSent,          // you can also add this if you want to expose state to UI
  pendingEmail, 
  sendPasswordResetOtp, // Added to context value
  verifyPasswordResetOtp, // Added to context value
  resetPassword, // Added to context value
  login,
};

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AuthContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppContextProvider");
  }
  return context;
};
