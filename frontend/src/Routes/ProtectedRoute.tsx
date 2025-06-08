import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppContext } from "../Context/AppContext"; // Correct usage of the hook

type Props = { children: React.ReactNode };

const ProtectedRoute = ({ children }: Props) => {
  const location = useLocation();
  const { isLoggedIn } = useAppContext(); // Use the useAppContext hook to get the context

  return isLoggedIn ? (
    <>{children}</>
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
};

export default ProtectedRoute;
