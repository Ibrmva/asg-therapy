import React, { Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import Homepage from "./pages/Homepage/Homepage";
import Tutorial from "./pages/Tutorial/Tutorial";
import Contact from "./pages/Contact/Contact";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import Search from "./components/Search/Search";
import Editor from "./pages/Editor/Editor";
import ImageGenerate from "./pages/Generate Image/ImageGenerate";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import translationEN from "./locales/en/translation.json";
import translationRU from "./locales/ru/translation.json";
import { ToastContainer } from "react-toastify";
import { AppContextProvider } from "./Context/AppContext";
import "react-toastify/dist/ReactToastify.css";
import LoginPage from "./pages/LoginPage/LoginPage";  
import RegisterPage from "./pages/RegisterPage/RegisterPage";
import ForgotPasswordpage from "./pages/ForgotPasswordpage/ForgotPasswordpage";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: translationEN,
      },
      ru: {
        translation: translationRU,
      },
    },
    fallbackLng: "en", 
    detection: {
      order: [
        "querystring",
        "cookie",
        "localStorage",
        "navigator",
        "htmlTag",
        "path",
        "subdomain",
      ],
      caches: ["localStorage", "cookie"],
    },
    interpolation: {
      escapeValue: false, 
    },
  });

export { i18n };

const AppRoutes: React.FC = () => {
  const location = useLocation();

  // const isHomepage = location.pathname === "/";

  return (
    <>
    <AppContextProvider>
      <Navbar />
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/tutorial" element={<Tutorial />} />
          {/* <Route path="/contact" element={<Contact />} /> */}
          <Route path="/editor" element={<Editor />} />
          <Route path="/generate" element={<ImageGenerate />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/reset-password" element={<ForgotPasswordpage />} />
        </Routes>
      </Suspense>
      {location.pathname !== "/editor" && <Footer />}
    </AppContextProvider>
    </>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
};

export default App;