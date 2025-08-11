import React from "react";
import styled, { keyframes } from "styled-components";
import { motion } from "framer-motion";

// Constants & Themes
const CYBERPUNK_PALETTE = {
  primary: '#00f0ff',
  secondary: '#ff00d4',
  dark: '#0a0a1e',
  light: '#f0f0ff'
};

const CYBERFONT = "'Orbitron', 'Rajdhani', 'Azeret Mono', sans-serif";

// Animations
const fadeInLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const plasmaPulse = keyframes`
  0% {
    box-shadow: 0 0 10px rgba(0, 240, 255, 0.3), 0 0 20px rgba(255, 0, 212, 0.3);
  }
  50% {
    box-shadow: 0 0 20px rgba(0, 240, 255, 0.6), 0 0 40px rgba(255, 0, 212, 0.6);
  }
  100% {
    box-shadow: 0 0 10px rgba(0, 240, 255, 0.3), 0 0 20px rgba(255, 0, 212, 0.3);
  }
`;

const holographicGlow = keyframes`
  0% { opacity: 0.3; }
  50% { opacity: 0.8; }
  100% { opacity: 0.3; }
`;

const scanline = keyframes`
  0% { background-position: 0 0; }
  100% { background-position: 0 20px; }
`;

// Styled Components
const CyberSidebar = styled(motion.div)`
  width: 300px;
  height: 100vh;
  background: rgba(15, 15, 40, 0.9);
  backdrop-filter: blur(20px);
  display: flex;
  flex-direction: column;
  padding: 2rem 1.5rem;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    8px 0 50px rgba(0, 240, 255, 0.1),
    inset -5px 0 15px rgba(0, 240, 255, 0.05);
  font-family: ${CYBERFONT};
  z-index: 999;
  position: relative;
  overflow: hidden;
  animation: ${fadeInLeft} 0.8s ease-out;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      to bottom,
      transparent,
      rgba(0, 240, 255, 0.03),
      transparent
    );
    pointer-events: none;
    animation: ${holographicGlow} 6s infinite;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      rgba(0, 240, 255, 0.03) 50%,
      transparent 50%
    );
    background-size: 100% 2px;
    animation: ${scanline} 1s linear infinite;
    pointer-events: none;
    opacity: 0.15;
  }
`;

const LogoContainer = styled(motion.div)`
  padding: 1rem 0 3rem;
  display: flex;
  justify-content: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 25%;
    width: 50%;
    height: 1px;
    background: linear-gradient(
      to right,
      transparent,
      ${CYBERPUNK_PALETTE.primary},
      transparent
    );
    filter: drop-shadow(0 0 5px ${CYBERPUNK_PALETTE.primary});
  }
`;

const CyberLogo = styled(motion.img)`
  height: 60px;
  width: auto;
  filter:
    drop-shadow(0 0 10px ${CYBERPUNK_PALETTE.primary})
    drop-shadow(0 0 20px rgba(255, 0, 212, 0.5));
  transition: all 0.5s ease;

  &:hover {
    filter:
      drop-shadow(0 0 15px ${CYBERPUNK_PALETTE.primary})
      drop-shadow(0 0 30px rgba(255, 0, 212, 0.7));
    transform: scale(1.05);
  }
`;

const NavItems = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-top: 2rem;
`;

const CyberNavButton = styled(motion.button)`
  padding: 1.2rem 1.5rem;
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: ${props => props.$active ? '#fff' : 'rgba(255, 255, 255, 0.7)'};
  background: ${props => props.$active
    ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.3), rgba(255, 0, 212, 0.3))'
    : 'transparent'};
  border: ${props => props.$active
    ? '1px solid rgba(255, 255, 255, 0.3)'
    : '1px solid transparent'};
  box-shadow: ${props => props.$active
    ? '0 0 30px rgba(0, 240, 255, 0.3)'
    : 'none'};
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 1.2rem;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(5px);
  transition: all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1);
  z-index: 1;

  svg {
    width: 24px;
    height: 24px;
    fill: ${props => props.$active ? '#fff' : 'rgba(255,255,255,0.7)'};
    transition: all 0.3s ease;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(0, 240, 255, 0.1),
      transparent
    );
    transition: all 0.6s ease;
    z-index: -1;
  }

  &:hover::before {
    left: 100%;
  }

  &:hover {
    color: #fff;
    transform: translateX(8px);
    background: ${props => props.$active
      ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.4), rgba(255, 0, 212, 0.4))'
      : 'rgba(255, 255, 255, 0.1)'};
    box-shadow: ${props => props.$active
      ? '0 0 40px rgba(0, 240, 255, 0.4)'
      : '0 0 20px rgba(0, 240, 255, 0.1)'};

    svg {
      fill: #fff;
      filter: drop-shadow(0 0 5px ${CYBERPUNK_PALETTE.primary});
    }
  }

  &:active {
    transform: translateX(8px) scale(0.98);
  }
`;

const ActiveIndicator = styled(motion.div)`
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 60%;
  background: linear-gradient(to bottom, ${CYBERPUNK_PALETTE.primary}, ${CYBERPUNK_PALETTE.secondary});
  border-radius: 0 4px 4px 0;
  box-shadow: 0 0 10px ${CYBERPUNK_PALETTE.primary};
`;

// Icons
const HomeIcon = () => (
  <svg viewBox="0 0 24 24">
    <defs>
      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={CYBERPUNK_PALETTE.primary} />
        <stop offset="100%" stopColor={CYBERPUNK_PALETTE.secondary} />
      </linearGradient>
    </defs>
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="url(#gradient)"/>
  </svg>
);

const MetricsIcon = () => (
  <svg viewBox="0 0 24 24">
    <defs>
      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={CYBERPUNK_PALETTE.primary} />
        <stop offset="100%" stopColor={CYBERPUNK_PALETTE.secondary} />
      </linearGradient>
    </defs>
    <path d="M3 3v18h18V3H3zm16 16H5V5h14v14z" fill="url(#gradient)"/>
    <path d="M7 10h2v8H7zm4-4h2v12h-2zm4-4h2v16h-2z" fill="url(#gradient)"/>
  </svg>
);

const FeatureImportanceIcon = () => (
  <svg viewBox="0 0 24 24">
    <defs>
      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={CYBERPUNK_PALETTE.primary} />
        <stop offset="100%" stopColor={CYBERPUNK_PALETTE.secondary} />
      </linearGradient>
    </defs>
    <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z" fill="url(#gradient)"/>
    <path d="M12 17.5c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="url(#gradient)"/>
    <circle cx="12" cy="9" r="2" fill="url(#gradient)"/>
  </svg>
);

const ResidualsIcon = () => (
  <svg viewBox="0 0 24 24">
    <defs>
      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={CYBERPUNK_PALETTE.primary} />
        <stop offset="100%" stopColor={CYBERPUNK_PALETTE.secondary} />
      </linearGradient>
    </defs>
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" fill="url(#gradient)"/>
    <path d="M12 7h2v2h-2z" fill="url(#gradient)" opacity="0.5"/>
  </svg>
);

const PredictionsIcon = () => (
  <svg viewBox="0 0 24 24">
    <defs>
      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={CYBERPUNK_PALETTE.primary} />
        <stop offset="100%" stopColor={CYBERPUNK_PALETTE.secondary} />
      </linearGradient>
    </defs>
    <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z" fill="url(#gradient)"/>
    <path d="M12 17.5c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" fill="url(#gradient)"/>
    <path d="M12 7c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="url(#gradient)"/>
  </svg>
);

const AnomaliesIcon = () => (
  <svg viewBox="0 0 24 24">
    <defs>
      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={CYBERPUNK_PALETTE.primary} />
        <stop offset="100%" stopColor={CYBERPUNK_PALETTE.secondary} />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="8" stroke="url(#gradient)" strokeWidth="2" fill="none"/>
    <circle cx="12" cy="12" r="2" fill="url(#gradient)"/>
    <path d="M12 6v2M12 16v2M6 12h2M16 12h2" stroke="url(#gradient)" strokeWidth="2"/>
  </svg>
);

const ResultsIcon = () => (
  <svg viewBox="0 0 24 24">
    <defs>
      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={CYBERPUNK_PALETTE.primary} />
        <stop offset="100%" stopColor={CYBERPUNK_PALETTE.secondary} />
      </linearGradient>
    </defs>
    <path d="M4 7h16v2H4zM4 15h16v2H4zM4 11h16v2H4z" fill="url(#gradient)"/>
    <circle cx="9" cy="12" r="1.5" fill="url(#gradient)"/>
    <circle cx="15" cy="12" r="1.5" fill="url(#gradient)"/>
  </svg>
);

// Component
function CyberSidebarComponent({ currentPage, setPage }) {
  return (
    <CyberSidebar
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <LogoContainer>
        <CyberLogo
          src="/logo.png"
          alt="Cyber Analytics"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        />
      </LogoContainer>
      <NavItems>
        <CyberNavButton
          onClick={() => setPage("home")}
          $active={currentPage === "home"}
          whileHover={{ x: 8 }}
          whileTap={{ x: 8, scale: 0.98 }}
        >
          {currentPage === "home" && (
            <ActiveIndicator
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}
          <HomeIcon />
          <span>Home</span>
        </CyberNavButton>
        <CyberNavButton
          onClick={() => setPage("metrics")}
          $active={currentPage === "metrics"}
          whileHover={{ x: 8 }}
          whileTap={{ x: 8, scale: 0.98 }}
        >
          {currentPage === "metrics" && (
            <ActiveIndicator
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}
          <MetricsIcon />
          <span>Metrics</span>
        </CyberNavButton>
        <CyberNavButton
          onClick={() => setPage("featureimportance")}
          $active={currentPage === "featureimportance"}
          whileHover={{ x: 8 }}
          whileTap={{ x: 8, scale: 0.98 }}
        >
          {currentPage === "featureimportance" && (
            <ActiveIndicator
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}
          <FeatureImportanceIcon />
          <span>Feature Importance</span>
        </CyberNavButton>
        <CyberNavButton
          onClick={() => setPage("residuals")}
          $active={currentPage === "residuals"}
          whileHover={{ x: 8 }}
          whileTap={{ x: 8, scale: 0.98 }}
        >
          {currentPage === "residuals" && (
            <ActiveIndicator
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}
          <ResidualsIcon />
          <span>Residuals</span>
        </CyberNavButton>
        <CyberNavButton
          onClick={() => setPage("predictions")}
          $active={currentPage === "predictions"}
          whileHover={{ x: 8 }}
          whileTap={{ x: 8, scale: 0.98 }}
        >
          {currentPage === "predictions" && (
            <ActiveIndicator
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}
          <PredictionsIcon />
          <span>Predictions</span>
        </CyberNavButton>
        <CyberNavButton
          onClick={() => setPage("anomalies")}
          $active={currentPage === "anomalies"}
          whileHover={{ x: 8 }}
          whileTap={{ x: 8, scale: 0.98 }}
        >
          {currentPage === "anomalies" && (
            <ActiveIndicator
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}
          <AnomaliesIcon />
          <span>Anomalies</span>
        </CyberNavButton>
        <CyberNavButton
          onClick={() => setPage("results")}
          $active={currentPage === "results"}
          whileHover={{ x: 8 }}
          whileTap={{ x: 8, scale: 0.98 }}
        >
          {currentPage === "results" && (
            <ActiveIndicator
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}
          <ResultsIcon />
          <span>Results</span>
        </CyberNavButton>
      </NavItems>
    </CyberSidebar>
  );
}

export default CyberSidebarComponent;
