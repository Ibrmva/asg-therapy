import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../Context/AppContext";
import { FaUserCircle } from "react-icons/fa";

import "./Navbar.css";

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { isLoggedIn, setIsLoggedIn, userData, setUserData } = useAppContext();

  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const langDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const toggleLangDropdown = () => setIsLangDropdownOpen((prev) => !prev);
  const toggleUserDropdown = () => setIsUserDropdownOpen((prev) => !prev);

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    setIsLangDropdownOpen(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserData(null);
    setIsUserDropdownOpen(false);
    navigate("/");
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        langDropdownRef.current &&
        !langDropdownRef.current.contains(event.target as Node)
      ) {
        setIsLangDropdownOpen(false);
      }
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setIsUserDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
    <div className="navbar-container">
      <div className="navbar-links">
        <button onClick={() => navigate("/")} className="nav-button" type="button">
          {t("navbar.home")}
        </button>
        <button onClick={() => navigate("/generate")} className="nav-button" type="button">
          {t("navbar.gen")}
        </button>
        <button onClick={() => navigate("/tutorial")} className="nav-button" type="button">
          {t("navbar.tut")}
        </button>
        <button onClick={() => navigate("/contact")} className="nav-button" type="button">
          {t("navbar.contact")}
        </button>
      </div>
    </div>

      <div className="navbar-right" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {!isLoggedIn && (
            <button
              onClick={() => navigate("/login")}
              className="nav-button"
              type="button"
            >
              {t("navbar.login")}
            </button>
          )}


          {isLoggedIn && (
            <div
              className="user-avatar-container"
              ref={userDropdownRef}
              style={{ position: "relative", display: "flex", alignItems: "center" }}
            >

            <button
              onClick={toggleUserDropdown}
              className="avatar-button"
              type="button"
              aria-haspopup="true"
              aria-expanded={isUserDropdownOpen}
              aria-label="User menu"
            >
              <FaUserCircle />
            </button>
            {isUserDropdownOpen && (
              <div className="dropdown-menu user-dropdown">
                {/* <div className="user-name" aria-disabled="true" tabIndex={-1}>
                  {t("navbar.firstname")}, {userData?.firstname || "User"}
                </div> */}
                <button
                  onClick={handleLogout}
                  className="dropdown-item logout-button"
                  type="button"
                >
                  {t("navbar.logout")}
                </button>
              </div>
            )}
          </div>
        )}
        <div
          className="navbar-language"
          ref={langDropdownRef}
          style={{ position: "relative", display: "inline-block" }}
        >
          <button
            onClick={toggleLangDropdown}
            className="language-toggle"
            type="button"
            aria-haspopup="true"
            aria-expanded={isLangDropdownOpen}
          >
            {i18n.language.toUpperCase()} ▼
          </button>


          {isLangDropdownOpen && (
            <div className="dropdown-menu language-dropdown">
              <button
                onClick={() => handleLanguageChange("en")}
                className="dropdown-item"
                type="button"
              >
                {t("navbar.translationEN")}
              </button>
              <button
                onClick={() => handleLanguageChange("ru")}
                className="dropdown-item"
                type="button"
              >
                {t("navbar.translationRU")}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
