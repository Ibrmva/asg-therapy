import React, { createContext, ReactNode, useContext, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
// Define the shape of the context value
interface AuthContextType {
  backendUrl: string;
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  userData: any; // You can replace `any` with your user type
  setUserData: React.Dispatch<React.SetStateAction<any>>;
}

// Create context with default empty object cast as AuthContextType (to avoid TS errors)
export const AppContent = createContext<AuthContextType | undefined>(undefined);

interface AppContextProviderProps {
  children: ReactNode;
}

export const AppContextProvider: React.FC<AppContextProviderProps> = ({ children }) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || ""; // fallback to empty string if undefined
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(false);
  // const getAuthState = async () => {
  //   try {

  //   } catch (error){
  //       toast.error(error.message)
  //   }
  // }

  //   const getUserData = async () => {
  //   try {
  //     const {data} = await axios.get( backendUrl + '/api/user/data')
  //     data.success ? setUserData(data.user) : toast.error(data.message)
  //   } catch ( error ) {
  //     toast.error(error.message)
  //   }
  // }

  const value: AuthContextType = {
    backendUrl,
    isLoggedIn,setIsLoggedIn,
    userData, setUserData,
    // getUserData
  };

  return <AppContent.Provider value={value}>{children}</AppContent.Provider>;
};

// Custom hook for consuming auth context
export const AppContext = (): AuthContextType => {
  const context = useContext(AppContent);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AppContextProvider");
  }
  return context;
};

// import { createContext, useEffect, useState } from "react";
// import { UserProfile } from "../Models/User";
// import { useNavigate } from "react-router-dom";
// // import { loginAPI, registerAPI } from "../Services/AuthService";
// import { toast } from "react-toastify";
// import React from "react";
// import axios from "axios";

// type UserContextType = {
//   user: UserProfile | null;
//   token: string | null;
//   registerUser: (firstname:string, lastname: string, email: string, confirmPassword: string, password: string) => void;
//   loginUser: (username: string, password: string) => void;
//   logout: () => void;
//   isLoggedIn: () => boolean;
// };

// type Props = { children: React.ReactNode };

// const UserContext = createContext<UserContextType>({} as UserContextType);

// export const UserProvider = ({ children }: Props) => {
//   const navigate = useNavigate();
//   const [token, setToken] = useState<string | null>(null);
//   const [user, setUser] = useState<UserProfile | null>(null);
//   const [isReady, setIsReady] = useState(false);

//   useEffect(() => {
//     const user = localStorage.getItem("user");
//     const token = localStorage.getItem("token");
//     if (user && token) {
//       setUser(JSON.parse(user));
//       setToken(token);
//       axios.defaults.headers.common["Authorization"] = "Bearer " + token;
//     }
//     setIsReady(true);
//   }, []);

//  const registerUser = async (
//   firstname: string,
//   lastname: string,
//   email: string,
//   password: string,
//   confirmPassword: string
// ) => {
//   try {
//     const res = await registerAPI(firstname, lastname, email, password, confirmPassword);
//     if (res) {
//       localStorage.setItem("token", res.data.token);
//       const userObj = {
//         firstname: res.data.firstname,
//         lastname: res.data.lastname,
//         email: res.data.email,
//         password: res.data.password,
//         confirmPassword: res.data.confirmPassword,  
//       };
//       localStorage.setItem("user", JSON.stringify(userObj));
//       setToken(res.data.token);
//       setUser(userObj);
//       toast.success("Registration Success!");
//       navigate("/login");
//     }
//   } catch (e) {
//     toast.warning("Server error occurred");
//   }
// };



//   const loginUser = async (email: string, password: string) => {
//     await loginAPI(email, password)
//       .then((res) => {
//         if (res) {
//           localStorage.setItem("token", res?.data.token);
//           const userObj = {
//             password: res?.data.password,
//             email: res?.data.email,
//           };
//           localStorage.setItem("user", JSON.stringify(userObj));
//           setToken(res?.data.token!);
//           setUser(userObj!);
//           toast.success("Login Success!");
//           navigate("/search");
//         }
//       })
//       .catch((e) => toast.warning("Server error occured"));
//   };

//   const isLoggedIn = () => {
//     return !!user;
//   };

//   const logout = () => {
//     localStorage.removeItem("token");
//     localStorage.removeItem("user");
//     setUser(null);
//     setToken("");
//     navigate("/");
//   };

//   return (
//     <UserContext.Provider
//       value={{ loginUser, user, token, logout, isLoggedIn, registerUser }}
//     >
//       {isReady ? children : null}
//     </UserContext.Provider>
//   );
// };

// export const useAuth = () => React.useContext(UserContext);
