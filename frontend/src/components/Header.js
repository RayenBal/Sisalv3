import React, { useEffect, useRef } from "react";
import styled, { keyframes, css } from "styled-components";
import { motion, useAnimation } from "framer-motion";
import * as THREE from 'three';

// ==== CONSTANTS & THEMES ==== //
const CYBERPUNK_PALETTE = {
  primary: '#00f0ff',
  secondary: '#ff00d4',
  dark: '#0a0a1e',
  light: '#f0f0ff'
};

const CYBERFONT = "'Orbitron', 'Rajdhani', 'Azeret Mono', sans-serif";

// ==== ANIMATIONS ==== //
const fadeInDown = keyframes`
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const cyberPulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(0, 240, 255, 0.7); }
  70% { box-shadow: 0 0 0 15px rgba(0, 240, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(0, 240, 255, 0); }
`;

const glitchEffect = keyframes`
  0% { text-shadow: 0 0 10px ${CYBERPUNK_PALETTE.primary}, 0 0 20px ${CYBERPUNK_PALETTE.secondary}; }
  25% { text-shadow: -2px 0 10px ${CYBERPUNK_PALETTE.secondary}, 2px 0 20px ${CYBERPUNK_PALETTE.primary}; }
  50% { text-shadow: 0 -2px 10px ${CYBERPUNK_PALETTE.primary}, 0 2px 20px ${CYBERPUNK_PALETTE.secondary}; }
  75% { text-shadow: 2px 0 10px ${CYBERPUNK_PALETTE.secondary}, -2px 0 20px ${CYBERPUNK_PALETTE.primary}; }
  100% { text-shadow: 0 0 10px ${CYBERPUNK_PALETTE.primary}, 0 0 20px ${CYBERPUNK_PALETTE.secondary}; }
`;

const flicker = keyframes`
  0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { opacity: 1; }
  20%, 22%, 24%, 55% { opacity: 0.4; }
`;

const floatParticles = keyframes`
  0% { transform: translateY(0) rotate(0deg); opacity: 0.3; }
  50% { transform: translateY(-20px) rotate(180deg); opacity: 0.8; }
  100% { transform: translateY(0) rotate(360deg); opacity: 0.3; }
`;

// ==== 3D PARTICLE BACKGROUND ==== //
const ParticleCanvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  opacity: 0.7;
`;

const ThreeDParticles = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Three.js setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current,
      alpha: true,
      antialias: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 500;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 10;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.02,
      color: new THREE.Color(CYBERPUNK_PALETTE.primary),
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    camera.position.z = 5;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      particlesMesh.rotation.x += 0.0005;
      particlesMesh.rotation.y += 0.0005;
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      renderer.dispose();
    };
  }, []);

  return <ParticleCanvas ref={canvasRef} />;
};

// ==== STYLED COMPONENTS ==== //
const CyberHeader = styled(motion.header)`
  position: fixed;
  top: 0;
  width: 100%;
  height: 100px;
  background: rgba(10, 10, 30, 0.7);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 
    inset 0 0 20px rgba(0, 240, 255, 0.1),
    0 0 50px rgba(0, 240, 255, 0.05);
  z-index: 1000;
  animation: ${fadeInDown} 0.8s ease-out;
  font-family: ${CYBERFONT};
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      to right,
      transparent,
      rgba(0, 240, 255, 0.03),
      transparent
    );
    pointer-events: none;
  }
`;

const HeaderContainer = styled.div`
  max-width: 1600px;
  width: 100%;
  height: 100%;
  padding: 0 3rem;
  margin-right: 250px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
`;

const CyberLogo = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  font-size: 2rem;
  font-weight: 700;
  color: white;
  letter-spacing: 2px;
  cursor: pointer;

  span {
    background: linear-gradient(90deg, ${CYBERPUNK_PALETTE.primary}, ${CYBERPUNK_PALETTE.secondary});
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    animation: ${glitchEffect} 2s infinite;
  }
`;

const ScienceIcon = styled(motion.div)`
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(5px);
  box-shadow: 
    0 0 15px rgba(0, 240, 255, 0.3),
    inset 0 0 10px rgba(0, 240, 255, 0.2);

  svg {
    width: 28px;
    height: 28px;
    fill: url(#gradient);
    filter: drop-shadow(0 0 5px ${CYBERPUNK_PALETTE.primary});
  }
`;

const UserPanel = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0.8rem 1.5rem;
  margin-right: 100px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1);
  box-shadow: 
    0 0 20px rgba(0, 240, 255, 0.1),
    inset 0 0 10px rgba(0, 240, 255, 0.05);

  &:hover {
    transform: translateY(-3px) scale(1.02);
    background: rgba(255, 255, 255, 0.1);
    box-shadow: 
      0 0 30px rgba(0, 240, 255, 0.2),
      inset 0 0 15px rgba(0, 240, 255, 0.1);
  }
`;

const UserAvatar = styled(motion.div)`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${CYBERPUNK_PALETTE.primary}, ${CYBERPUNK_PALETTE.secondary});
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 1.2rem;
  animation: ${cyberPulse} 3s infinite;
  box-shadow: 
    0 0 20px rgba(0, 240, 255, 0.3),
    inset 0 0 10px rgba(255, 255, 255, 0.2);
`;

const UserName = styled(motion.div)`
  color: #eee;
  font-size: 1.1rem;
  font-weight: 500;
  letter-spacing: 1px;
  text-shadow: 0 0 10px rgba(0, 240, 255, 0.3);
`;

const FloatingParticles = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: -1;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
      circle at center,
      rgba(0, 240, 255, 0.1) 0%,
      transparent 70%
    );
    animation: ${floatParticles} 8s linear infinite;
  }
`;

// ==== MAIN COMPONENT ==== //
function Header() {
  const controls = useAnimation();

  return (
    <CyberHeader
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <ThreeDParticles />
      <FloatingParticles />
      
      <HeaderContainer>
        <CyberLogo
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onHoverStart={() => controls.start({ 
            scale: [1, 1.1, 1],
            transition: { duration: 0.6, repeat: Infinity, ease: "easeInOut" } 
          })}
          onHoverEnd={() => controls.stop()}
        >
          <ScienceIcon
            animate={controls}
          transition={{ ease: "easeInOut" }}
          >
            <svg viewBox="0 0 24 24">
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={CYBERPUNK_PALETTE.primary} />
                  <stop offset="100%" stopColor={CYBERPUNK_PALETTE.secondary} />
                </linearGradient>
              </defs>
              <path d="M19.8 18.7L12 11.3V5h1c.6 0 1-.4 1-1s-.4-1-1-1H8c-.6 0-1 .4-1 1s.4 1 1 1h1v6.3L2.2 18.7c-.4.4-.5 1-.1 1.4.4.4 1 .5 1.4.1L12 13.5l8.5 6.7c.2.2.4.3.7.3.3 0 .5-.1.7-.3.4-.4.3-1-.1-1.4z"/>
            </svg>
          </ScienceIcon>
          <span>SISAL</span>v3 Scientific Platform
        </CyberLogo>

        <UserPanel
          whileHover={{ 
            scale: 1.05,
            boxShadow: `0 0 30px ${CYBERPUNK_PALETTE.primary}`
          }}
          whileTap={{ scale: 0.95 }}
          transition={{ ease: "easeInOut" }}
        >
          <UserAvatar
  animate={{ rotate: 360 }}
  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
>

            R
          </UserAvatar>
          <UserName>Rayen Balghouthi</UserName>
        </UserPanel>
      </HeaderContainer>
    </CyberHeader>
  );
}

export default Header;