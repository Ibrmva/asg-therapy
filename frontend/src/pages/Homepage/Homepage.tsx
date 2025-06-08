import React from "react";
import "./Homepage.css";
import homepageImage from "../../assets/homepage.webp";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "../../components/Button/Button";
import TitleText from "../../components/TitleText/TitleText";

const Homepage: React.FC = () => {
  const navigate = useNavigate();
  const handleStartProject = () => {
    navigate("/editor"); // Navigate to the editor page
  };
  const { t } = useTranslation();

  return (
    <div className="homepage-container">
      <div className="homepage-text">
        {/* <h1 className="homepage-title">ASG Therapy:</h1> */}
        < TitleText />
        {/* < Loader/> */}
        <h2 className="homepage-subtitle">{t("home.sub")}</h2>
        <p className="homepage-description">{t("home.text")}</p>
        <div className="button">
          <button className="button-start" onClick={handleStartProject}>
            <Button />
          </button>
        </div>
      </div>
      <div className="homepage-image">
        <img
          src={homepageImage}
          alt="Artistic painting"
          className="homepage-img"
        />
      </div>
      {/* <div className="explore-section">
        <p className="explore-text">Explore Our Library</p>
      </div> */}
    </div>
  );
};

export default Homepage;