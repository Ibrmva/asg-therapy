import React from "react";
import { useTranslation } from "react-i18next";
import "./Button.css"

const Button = () => {
  const { t } = useTranslation();

  return (
      <button className="btn">{t("home.button")}</button>
  );
};

export default Button;