import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Homepage from "../pages/Homepage/Homepage";
import ImageGenerate from "../pages/Generate Image/ImageGenerate";

import LoginPage from "../pages/LoginPage/LoginPage";
import RegisterPage from "../pages/RegisterPage/RegisterPage";
import ForgotPasswordpage from "../pages/ForgotPasswordpage/ForgotPasswordpage";
import ProtectedRoute from "./ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/", element: <Homepage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "reset-password", element: <ForgotPasswordpage />},
      {
        path: "search",
        element: (
          <ProtectedRoute>
            <ImageGenerate />
          </ProtectedRoute>
        ),
      },
      { path: "design-guide", element: <ImageGenerate /> },
      {
        path: "company/:ticker",
        element: (
          <ProtectedRoute>
            <ImageGenerate />
          </ProtectedRoute>
        ),
        children: [
          { path: "company-profile", element: <ImageGenerate /> },
          { path: "income-statement", element: <ImageGenerate /> },
          { path: "balance-sheet", element: <ImageGenerate /> },
          { path: "cashflow-statement", element: <ImageGenerate /> },
          { path: "historical-dividend", element: <ImageGenerate /> },
        ],
      },
    ],
  },
]);
