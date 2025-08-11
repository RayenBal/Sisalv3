import React, { useState } from "react";
import styled, { keyframes } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";

// ==== CONSTANTS & THEMES ==== //
const CYBERPUNK_PALETTE = {
  primary: '#00f0ff',
  secondary: '#ff00d4',
  dark: '#0a0a1e',
  light: '#f0f0ff'
};

const CYBERFONT = "'Orbitron', 'Rajdhani', 'Azeret Mono', sans-serif";

// ==== ANIMATIONS ==== //
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const holographicGlow = keyframes`
  0% { box-shadow: 0 0 10px rgba(0, 240, 255, 0.3); }
  50% { box-shadow: 0 0 20px rgba(0, 240, 255, 0.6); }
  100% { box-shadow: 0 0 10px rgba(0, 240, 255, 0.3); }
`;

const pulse = keyframes`
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
`;

// ==== STYLED COMPONENTS ==== //
const ModelSelectorContainer = styled(motion.div)`
  max-width: 1400px;
  margin: 2rem auto;
  padding: 0 2rem;
  animation: ${fadeIn} 0.6s ease-out;
`;

const ModelSelectorCard = styled(motion.div)`
  background: rgba(20, 20, 40, 0.7);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  padding: 2rem;
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.3),
    inset 0 0 20px rgba(0, 240, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      45deg,
      transparent,
      rgba(0, 240, 255, 0.03),
      transparent
    );
    animation: ${pulse} 6s infinite;
  }
`;

const ModelSelectorLabel = styled(motion.label)`
  display: block;
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.1rem;
  margin-bottom: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-family: ${CYBERFONT};
  text-shadow: 0 0 10px rgba(0, 240, 255, 0.3);
`;

const ModelSelectWrapper = styled(motion.div)`
  position: relative;
  display: inline-block;
  z-index: 1;
`;

const ModelSelect = styled(motion.select)`
  appearance: none;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 1rem 3rem 1rem 1.5rem;
  color: white;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1);
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2300f0ff'%3e%3cpath d='M7 10l5 5 5-5z'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 1.2rem center;
  background-size: 1.2rem;
  min-width: 250px;
  font-family: ${CYBERFONT};
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  text-transform: uppercase;
  &:hover {
    border-color: rgba(0, 240, 255, 0.5);
    box-shadow: 0 0 0 3px rgba(0, 240, 255, 0.2);
    transform: translateY(-2px);
  }
  &:focus {
    outline: none;
    border-color: ${CYBERPUNK_PALETTE.primary};
    box-shadow:
      0 0 0 3px rgba(0, 240, 255, 0.3),
      0 0 30px rgba(0, 240, 255, 0.1);
  }
`;

const ModelOption = styled(motion.option)`
  background: #1a1a2e;
  color: white;
  padding: 1rem;
  font-family: ${CYBERFONT};
`;

const ModelBadge = styled(motion.span)`
  background: rgba(0, 0, 0, 0.4);
  padding: 0.5rem 1.2rem;
  border-radius: 25px;
  font-size: 1rem;
  color: #fff;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 1.5rem;
  vertical-align: middle;
  font-family: ${CYBERFONT};
  text-transform: uppercase;
  letter-spacing: 1px;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
  &::before {
    content: "";
    display: block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: ${props =>
      props.model === 'xgboost' ? '#00f0ff' :
      props.model === 'randomforest' ? '#4CAF50' :
      props.model === 'bilstm' ? '#9c27b0' :
      props.model === 'transformer' ? '#FF8E53' :
      props.model === 'consensus' ? '#FFEB3B' : '#00f0ff'};
    box-shadow: 0 0 10px ${props =>
      props.model === 'xgboost' ? 'rgba(0, 240, 255, 0.7)' :
      props.model === 'randomforest' ? 'rgba(76, 175, 80, 0.7)' :
      props.model === 'bilstm' ? 'rgba(156, 39, 176, 0.7)' :
      props.model === 'transformer' ? 'rgba(255, 142, 83, 0.7)' :
      props.model === 'consensus' ? 'rgba(255, 235, 59, 0.7)' : 'rgba(0, 240, 255, 0.7)'};
    animation: ${pulse} 2s infinite;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent
    );
    transition: 0.5s;
  }

  &:hover::after {
    left: 100%;
  }
`;

const SelectorGlow = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(
    circle at center,
    rgba(0, 240, 255, 0.1) 0%,
    transparent 70%
  );
  pointer-events: none;
  z-index: -1;
`;

function ModelSelector({ model, setModel, models = [] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ModelSelectorContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <ModelSelectorCard
        whileHover={{
          boxShadow: '0 0 30px rgba(0, 240, 255, 0.2)',
          y: -5
        }}
      >
        <ModelSelectorLabel>
          SELECT AI MODEL
        </ModelSelectorLabel>
        <ModelSelectWrapper>
          <SelectorGlow
            animate={{
              opacity: [0.3, 0.6, 0.3],
              transition: { duration: 4, repeat: Infinity }
            }}
          />
          <ModelSelect
            value={model}
            onChange={(e) => setModel(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setIsOpen(false)}
            whileTap={{ scale: 0.98 }}
          >
            {models.map((m) => (
              <ModelOption
                key={m}
                value={m}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {m === "xgboost"
                  ? "XGBOOST QUANTUM"
                  : m === "randomforest"
                  ? "RANDOM FOREST"
                  : m === "bilstm"
                  ? "BILSTM NEURAL"
                  : m === "transformer"
                  ? "TRANSFORMER AI"
                  : m === "consensus"
                  ? "CONSENSUS ENSEMBLE"
                  : m.toUpperCase()}
              </ModelOption>
            ))}
          </ModelSelect>

          <ModelBadge
            model={model}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {model === "xgboost"
              ? "XGBOOST"
              : model === "randomforest"
              ? "RANDOM FOREST"
              : model === "bilstm"
              ? "BILSTM"
              : model === "transformer"
              ? "TRANSFORMER"
              : model === "consensus"
              ? "CONSENSUS"
              : model.toUpperCase()}
          </ModelBadge>
        </ModelSelectWrapper>
      </ModelSelectorCard>
    </ModelSelectorContainer>
  );
}

export default ModelSelector;