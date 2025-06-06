import React from 'react';
import styled, { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;800&display=swap');

  :root {
    --bg: #0f0f0f;
    --clr-1: #ffd8c5;
    --clr-2: #ffd8c5;
    --clr-3: #b5e0d3;
    --clr-4: #e8cdf6;
    --blur: 1rem;
    --fs: clamp(2rem, 6vw, 5rem);
    --ls: clamp(-1.75px, -0.25vw, -3.5px);
  }

  body {
    min-height: 100vh;
    display: grid;
    place-items: center;
    background-color: var(--bg);
    color: #e5e3e3;
    font-family: 'Montserrat', sans-serif;
  }

  *,
  *::before,
  *::after {
    font-family: inherit;
    box-sizing: border-box;
  }
`;

const AuroraComponent: React.FC = () => {
  return (
    <>
      <GlobalStyles />
      <Content>
        <Title>
          ASG Therapy:
          <Aurora>
            <AuroraItem1 />
            <AuroraItem2 />
            <AuroraItem3 />
            <AuroraItem4 />
          </Aurora>
        </Title>
      </Content>
    </>
  );
};

// Styled components
const Content = styled.div`
  // text-align: center;
`;

const Title = styled.h1`
  font-size: var(--fs);
  font-weight: 600;
  letter-spacing: var(--ls);
  position: relative;
  overflow: hidden;
  background: var(--bg);
  margin: 0;
  margin-left
  padding: 1rem;
`;

const Aurora = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  mix-blend-mode: darken;
  pointer-events: none;
`;

const AuroraBase = styled.div`
  overflow: hidden;
  position: absolute;
  width: 60vw;
  height: 60vw;
  border-radius: 37% 29% 27% 27% / 28% 25% 41% 37%;
  filter: blur(var(--blur));
  mix-blend-mode: overlay;
  animation: aurora-border 6s ease-in-out infinite;
`;

const AuroraItem1 = styled(AuroraBase)`
  background-color: var(--clr-1);
  top: -50%;
  animation: aurora-border 6s ease-in-out infinite,
    aurora-1 8s ease-in-out infinite alternate;

  @keyframes aurora-1 {
    0% {
      top: 0;
      right: 0;
    }
    50% {
      top: 100%;
      right: 75%;
    }
    75% {
      top: 100%;
      right: 25%;
    }
    100% {
      top: 0;
      right: 0;
    }
  }
`;

const AuroraItem2 = styled(AuroraBase)`
  background-color: var(--clr-3);
  right: 0;
  top: 0;
  animation: aurora-border 6s ease-in-out infinite,
    aurora-2 12s ease-in-out infinite alternate;

  @keyframes aurora-2 {
    0% {
      top: -50%;
      left: 0%;
    }
    60% {
      top: 100%;
      left: 75%;
    }
    85% {
      top: 100%;
      left: 25%;
    }
    100% {
      top: -50%;
      left: 0%;
    }
  }
`;

const AuroraItem3 = styled(AuroraBase)`
  background-color: var(--clr-2);
  left: 0;
  bottom: 0;
  animation: aurora-border 6s ease-in-out infinite,
    aurora-3 8s ease-in-out infinite alternate;

  @keyframes aurora-3 {
    0% {
      bottom: 0;
      left: 0;
    }
    40% {
      bottom: 100%;
      left: 75%;
    }
    65% {
      bottom: 40%;
      left: 50%;
    }
    100% {
      bottom: 0;
      left: 0;
    }
  }
`;

const AuroraItem4 = styled(AuroraBase)`
  background-color: var(--clr-4);
  right: 0;
  bottom: -50%;
  animation: aurora-border 6s ease-in-out infinite,
    aurora-4 24s ease-in-out infinite alternate;

  @keyframes aurora-4 {
    0% {
      bottom: -50%;
      right: 0;
    }
    50% {
      bottom: 0%;
      right: 40%;
    }
    90% {
      bottom: 50%;
      right: 25%;
    }
    100% {
      bottom: -50%;
      right: 0;
    }
  }
`;

// Define the border animation globally since it's shared by all items
const AuroraBorderAnimation = createGlobalStyle`
  @keyframes aurora-border {
    0% {
      border-radius: 37% 29% 27% 27% / 28% 25% 41% 37%;
    }
    25% {
      border-radius: 47% 29% 39% 49% / 61% 19% 66% 26%;
    }
    50% {
      border-radius: 57% 23% 47% 72% / 63% 17% 66% 33%;
    }
    75% {
      border-radius: 28% 49% 29% 100% / 93% 20% 64% 25%;
    }
    100% {
      border-radius: 37% 29% 27% 27% / 28% 25% 41% 37%;
    }
  }
`;

export default function TitleText() {
  return (
    <>
      <AuroraBorderAnimation />
      <AuroraComponent />
    </>
  );
}