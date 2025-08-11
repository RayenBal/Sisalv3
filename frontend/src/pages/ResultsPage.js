import React, { useState, useCallback, useEffect } from "react";
import axios from "axios";
import styled, { keyframes, css } from "styled-components";
import { fadeIn, zoomIn, slideInUp } from 'react-animations';
import { PulseLoader } from 'react-spinners';
import { useDropzone } from 'react-dropzone';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from "framer-motion";

// Holographic animations
const holographicEffect = keyframes`
  0% { box-shadow: 0 0 10px rgba(0, 219, 222, 0.3), 0 0 20px rgba(252, 0, 255, 0.3); }
  50% { box-shadow: 0 0 20px rgba(0, 219, 222, 0.6), 0 0 40px rgba(252, 0, 255, 0.6); }
  100% { box-shadow: 0 0 10px rgba(0, 219, 222, 0.3), 0 0 20px rgba(252, 0, 255, 0.3); }
`;

const particleAnimation = keyframes`
  0% { transform: translate(0, 0); opacity: 1; }
  100% { transform: translate(var(--tx), var(--ty)); opacity: 0; }
`;

const fadeInAnimation = keyframes`${fadeIn}`;
const zoomInAnimation = keyframes`${zoomIn}`;
const slideInUpAnimation = keyframes`${slideInUp}`;

// Futuristic styled components
const QuantumContainer = styled.div`
  max-width: 1600px;
  margin: 2rem auto;
  margin-top: 150px;
  padding: 0 1rem;
  perspective: 1000px;
  font-family: 'Orbitron', 'Rajdhani', sans-serif;
`;

const HolographicCard = styled.div`
  background: linear-gradient(145deg, #0f0f1a 0%, #1a1a2e 100%);
  border-radius: 24px;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.7), 
              0 0 100px rgba(0, 219, 222, 0.1) inset;
  overflow: hidden;
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  padding: 3rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(15px);
  position: relative;
  animation: ${holographicEffect} 4s infinite;
  transform-style: preserve-3d;

  &:hover {
    transform: translateY(-5px) rotateX(1deg) rotateY(1deg);
    box-shadow: 0 40px 80px rgba(0, 0, 0, 0.8), 
                0 0 120px rgba(252, 0, 255, 0.15) inset;
  }

  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(45deg, 
      rgba(0, 219, 222, 0.1), 
      rgba(252, 0, 255, 0.1), 
      rgba(0, 219, 222, 0.1));
    z-index: -1;
    border-radius: 25px;
    animation: ${holographicEffect} 6s infinite reverse;
  }
`;

const CyberTitle = styled.h2`
  margin: 0 0 2rem 0;
  color: #fff;
  font-size: 3rem;
  font-weight: 700;
  text-align: center;
  background: linear-gradient(90deg, #00dbde, #fc00ff, #00dbde);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 2px;
  text-shadow: 0 0 30px rgba(0, 219, 222, 0.5);
  position: relative;
  text-transform: uppercase;
  font-family: 'Orbitron', sans-serif;
  
  &::after {
    content: '';
    display: block;
    width: 200px;
    height: 4px;
    background: linear-gradient(90deg, #00dbde, #fc00ff);
    margin: 1.5rem auto 0;
    border-radius: 4px;
    box-shadow: 0 0 20px rgba(0, 219, 222, 0.5);
  }
`;

const ModelSelector = styled.div`
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 3rem;
  flex-wrap: wrap;
`;

const CyberButton = styled(motion.button)`
  background: ${props => props.active ?
    props.model === 'bilstm' ? 'linear-gradient(145deg, #9c27b0, #673ab7)' :
    props.model === 'transformer' ? 'linear-gradient(145deg, #FF6B6B, #FF8E53)' :
    props.model === 'Random Forest' ? 'linear-gradient(145deg, #4CAF50, #2E7D32)' : 
    'linear-gradient(145deg, #4facfe, #00f2fe)' :
    'rgba(255, 255, 255, 0.05)'};
  color: white;
  border: none;
  padding: 1rem 2.2rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  font-weight: 700;
  font-size: 1.1rem;
  box-shadow: ${props => props.active ? 
    props.model === 'bilstm' ? '0 10px 30px rgba(156, 39, 176, 0.6)' :
    props.model === 'transformer' ? '0 10px 30px rgba(255, 107, 107, 0.6)' :
    props.model === 'Random Forest' ? '0 10px 30px rgba(76, 175, 80, 0.6)' : 
    '0 10px 30px rgba(79, 172, 254, 0.6)' : 
    '0 5px 15px rgba(0, 0, 0, 0.2)'};
  position: relative;
  overflow: hidden;
  z-index: 1;
  border: ${props => props.active ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)'};
  text-transform: uppercase;
  letter-spacing: 1px;
  font-family: 'Rajdhani', sans-serif;
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(145deg, 
      ${props => props.model === 'bilstm' ? 'rgba(156, 39, 176, 0.4)' :
      props.model === 'transformer' ? 'rgba(255, 107, 107, 0.4)' :
      props.model === 'Random Forest' ? 'rgba(76, 175, 80, 0.4)' : 'rgba(79, 172, 254, 0.4)'}, 
      rgba(255,255,255,0));
    z-index: -1;
    opacity: ${props => props.active ? '1' : '0'};
    transition: opacity 0.4s ease;
  }

  &:hover {
    transform: translateY(-5px) scale(1.05);
    box-shadow: ${props => props.active ? 
      props.model === 'bilstm' ? '0 15px 40px rgba(156, 39, 176, 0.8)' :
      props.model === 'transformer' ? '0 15px 40px rgba(255, 107, 107, 0.8)' :
      props.model === 'Random Forest' ? '0 15px 40px rgba(76, 175, 80, 0.8)' : 
      '0 15px 40px rgba(79, 172, 254, 0.8)' :
      '0 10px 25px rgba(0, 0, 0, 0.3)'};
  }

  &:active {
    transform: translateY(2px);
  }
`;

const CyberDropzone = styled(motion.div)`
  border: 3px dashed ${props => props.isDragActive ?
    props.model === 'bilstm' ? 'rgba(156, 39, 176, 0.7)' :
    props.model === 'transformer' ? 'rgba(255, 107, 107, 0.7)' :
    props.model === 'Random Forest' ? 'rgba(76, 175, 80, 0.7)' : 'rgba(79, 172, 254, 0.7)' :
    'rgba(255, 255, 255, 0.3)'};
  border-radius: 20px;
  padding: 4rem 2rem;
  text-align: center;
  margin-bottom: 3rem;
  background: ${props => props.isDragActive ?
    props.model === 'bilstm' ? 'rgba(156, 39, 176, 0.15)' :
    props.model === 'transformer' ? 'rgba(255, 107, 107, 0.15)' :
    props.model === 'Random Forest' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(79, 172, 254, 0.15)' :
    'rgba(255, 255, 255, 0.05)'};
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(5px);
  animation: ${props => props.isDragActive ? css`${zoomInAnimation} 0.5s ease` : 'none'};

  &:hover {
    border-color: ${props =>
      props.model === 'bilstm' ? 'rgba(156, 39, 176, 0.7)' :
      props.model === 'transformer' ? 'rgba(255, 107, 107, 0.7)' :
      props.model === 'Random Forest' ? 'rgba(76, 175, 80, 0.7)' : 'rgba(79, 172, 254, 0.7)'};
    background: ${props =>
      props.model === 'bilstm' ? 'rgba(156, 39, 176, 0.15)' :
      props.model === 'transformer' ? 'rgba(255, 107, 107, 0.15)' :
      props.model === 'Random Forest' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(79, 172, 254, 0.15)'};
    transform: translateY(-5px);
  }

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      to bottom right,
      transparent,
      transparent,
      transparent,
      ${props =>
        props.model === 'bilstm' ? 'rgba(156, 39, 176, 0.2)' :
        props.model === 'transformer' ? 'rgba(255, 107, 107, 0.2)' :
        props.model === 'Random Forest' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(79, 172, 254, 0.2)'},
      transparent
    );
    transform: rotate(30deg);
    transition: all 0.7s ease;
  }

  &:hover::before {
    animation: shine 2s infinite;
  }

  @keyframes shine {
    0% {
      left: -50%;
    }
    100% {
      left: 150%;
    }
  }
`;

const CyberDropzoneText = styled.p`
  color: ${props => props.isDragActive ?
    props.model === 'bilstm' ? 'rgba(186, 104, 200, 0.9)' :
    props.model === 'transformer' ? 'rgba(255, 142, 83, 0.9)' :
    props.model === 'Random Forest' ? 'rgba(76, 175, 80, 0.9)' : 'rgba(79, 172, 254, 0.9)' :
    'rgba(255, 255, 255, 0.7)'};
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: ${props => props.isDragActive ? '0 0 15px rgba(255, 255, 255, 0.5)' : 'none'};
  transition: all 0.4s ease;
`;

const CyberFileName = styled.div`
  color: ${props =>
    props.model === 'bilstm' ? 'rgba(186, 104, 200, 0.9)' :
    props.model === 'transformer' ? 'rgba(255, 142, 83, 0.9)' :
    props.model === 'Random Forest' ? 'rgba(76, 175, 80, 0.9)' : 'rgba(23, 190, 187, 0.9)'};
  font-weight: 700;
  margin-top: 1.5rem;
  font-size: 1.2rem;
  background: rgba(0, 0, 0, 0.4);
  padding: 0.8rem 1.5rem;
  border-radius: 12px;
  display: inline-block;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  animation: ${fadeInAnimation} 0.5s ease;
`;

const CyberUploadButton = styled(motion.button)`
  background: linear-gradient(145deg,
    ${props => props.model === 'transformer' ? '#FF6B6B' :
    props.model === 'bilstm' ? '#9c27b0' :
    props.model === 'Random Forest' ? '#4CAF50' : '#17BEBB'},
    ${props => props.model === 'transformer' ? '#FF8E53' :
    props.model === 'bilstm' ? '#ba68c8' :
    props.model === 'Random Forest' ? '#45a049' : '#4facfe'});
  color: white;
  border: none;
  padding: 1.2rem 3rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  font-weight: 700;
  font-size: 1.3rem;
  box-shadow: 0 15px 35px
    ${props => props.model === 'transformer' ? 'rgba(255, 107, 107, 0.5)' :
    props.model === 'bilstm' ? 'rgba(156, 39, 176, 0.5)' :
    props.model === 'Random Forest' ? 'rgba(76, 175, 80, 0.5)' : 'rgba(23, 190, 187, 0.5)'};
  position: relative;
  overflow: hidden;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-width: 300px;
  font-family: 'Orbitron', sans-serif;
  z-index: 1;

  &:hover {
    transform: translateY(-5px) scale(1.05);
    box-shadow: 0 20px 45px
      ${props => props.model === 'transformer' ? 'rgba(255, 107, 107, 0.8)' :
      props.model === 'bilstm' ? 'rgba(156, 39, 176, 0.8)' :
      props.model === 'Random Forest' ? 'rgba(76, 175, 80, 0.8)' : 'rgba(23, 190, 187, 0.8)'};
  }

  &:active {
    transform: translateY(2px);
  }

  &:disabled {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.5);
    cursor: not-allowed;
    box-shadow: none;
    transform: none !important;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      to right,
      transparent,
      rgba(255, 255, 255, 0.3),
      transparent
    );
    transform: translateX(-100%);
    transition: transform 0.8s ease;
    z-index: -1;
  }

  &:hover::after {
    transform: translateX(100%);
  }

  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(
      145deg,
      ${props => props.model === 'transformer' ? 'rgba(255, 107, 107, 0.3)' :
      props.model === 'bilstm' ? 'rgba(156, 39, 176, 0.3)' :
      props.model === 'Random Forest' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(23, 190, 187, 0.3)'},
      transparent
    );
    z-index: -1;
    border-radius: 14px;
    animation: ${holographicEffect} 5s infinite;
  }
`;

const CyberPlotContainer = styled.div`
  margin-top: 3rem;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  background: #121212;
  position: relative;
  transform-style: preserve-3d;
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);

  &:hover {
    transform: translateY(-10px) rotateX(1deg) rotateY(1deg);
    box-shadow: 0 30px 70px rgba(0, 0, 0, 0.7);
  }
`;

const CyberLoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 5rem;
  gap: 2rem;
  background: rgba(18, 18, 18, 0.8);
  border-radius: 20px;
  margin: 3rem 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
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
      rgba(255, 255, 255, 0.03),
      transparent
    );
    animation: shine 3s infinite;
  }
`;

const CyberLoadingText = styled.p`
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.5rem;
  text-align: center;
  max-width: 600px;
  line-height: 1.6;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
`;

const CyberErrorMessage = styled(motion.div)`
  color: #ff6b81;
  text-align: center;
  padding: 2.5rem;
  background: rgba(255, 107, 129, 0.15);
  border-radius: 20px;
  margin: 3rem 0;
  border: 1px solid rgba(255, 107, 129, 0.4);
  font-size: 1.3rem;
  box-shadow: 0 10px 30px rgba(255, 107, 129, 0.3);
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
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
      rgba(255, 107, 129, 0.1),
      transparent
    );
    animation: shine 3s infinite;
  }
`;

const CyberSuccessMessage = styled(motion.div)`
  color: ${props =>
    props.model === 'transformer' ? 'rgba(255, 142, 83, 0.9)' :
    props.model === 'bilstm' ? 'rgba(186, 104, 200, 0.9)' :
    props.model === 'Random Forest' ? 'rgba(46, 204, 113, 0.9)' : 'rgba(46, 204, 113, 0.9)'};
  text-align: center;
  padding: 2.5rem;
  background: ${props =>
    props.model === 'transformer' ? 'rgba(255, 142, 83, 0.15)' :
    props.model === 'bilstm' ? 'rgba(156, 39, 176, 0.15)' :
    props.model === 'Random Forest' ? 'rgba(46, 204, 113, 0.15)' : 'rgba(46, 204, 113, 0.15)'};
  border-radius: 20px;
  margin: 3rem 0;
  border: 1px solid ${props =>
    props.model === 'transformer' ? 'rgba(255, 142, 83, 0.4)' :
    props.model === 'bilstm' ? 'rgba(156, 39, 176, 0.4)' :
    props.model === 'Random Forest' ? 'rgba(46, 204, 113, 0.4)' : 'rgba(46, 204, 113, 0.4)'};
  font-size: 1.5rem;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
  text-transform: uppercase;
  letter-spacing: 2px;
  font-weight: 700;
  position: relative;
  overflow: hidden;
  font-family: 'Orbitron', sans-serif;

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
      ${props =>
        props.model === 'transformer' ? 'rgba(255, 142, 83, 0.1)' :
        props.model === 'bilstm' ? 'rgba(156, 39, 176, 0.1)' :
        props.model === 'Random Forest' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(46, 204, 113, 0.1)'},
      transparent
    );
    animation: shine 3s infinite;
  }
`;

const CyberTargetSelector = styled.div`
  margin: 3rem 0;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  width: 100%;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  transform-style: preserve-3d;

  label {
    color: ${props =>
      props.model === 'bilstm' ? 'rgba(186, 104, 200, 0.9)' :
      props.model === 'Random Forest' ? 'rgba(76, 175, 80, 0.9)' : 'rgba(79, 172, 254, 0.9)'};
    font-weight: 700;
    font-size: 1.5rem;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 2px;
    text-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
  }

  select {
    padding: 1.2rem;
    border-radius: 15px;
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    border: 2px solid ${props =>
      props.model === 'bilstm' ? 'rgba(156, 39, 176, 0.6)' :
      props.model === 'Random Forest' ? 'rgba(76, 175, 80, 0.6)' : 'rgba(79, 172, 254, 0.6)'};
    font-size: 1.2rem;
    width: 100%;
    text-align: center;
    appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3e%3cpath d='M7 10l5 5 5-5z'/%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 1.5rem center;
    background-size: 1.5rem;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    cursor: pointer;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    font-family: 'Rajdhani', sans-serif;
    text-transform: uppercase;
    letter-spacing: 1px;

    &:hover {
      border-color: ${props =>
        props.model === 'bilstm' ? 'rgba(186, 104, 200, 0.9)' :
        props.model === 'Random Forest' ? 'rgba(76, 175, 80, 0.9)' : 'rgba(79, 172, 254, 0.9)'};
      background: ${props =>
        props.model === 'bilstm' ? 'rgba(156, 39, 176, 0.3)' :
        props.model === 'Random Forest' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(79, 172, 254, 0.3)'};
      transform: translateY(-3px);
    }

    &:focus {
      outline: none;
      box-shadow: 0 0 0 4px ${props =>
        props.model === 'bilstm' ? 'rgba(156, 39, 176, 0.4)' :
        props.model === 'Random Forest' ? 'rgba(76, 175, 80, 0.4)' : 'rgba(79, 172, 254, 0.4)'};
    }
  }
`;

const CyberResultCard = styled(motion.div)`
  background: ${props =>
    props.model === 'bilstm' ? 'rgba(156, 39, 176, 0.15)' :
    props.model === 'Random Forest' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(79, 172, 254, 0.15)'};
  border-radius: 20px;
  padding: 2.5rem;
  margin: 3rem auto;
  color: #fff;
  width: 100%;
  max-width: 600px;
  border: 1px solid ${props =>
    props.model === 'bilstm' ? 'rgba(156, 39, 176, 0.4)' :
    props.model === 'Random Forest' ? 'rgba(76, 175, 80, 0.4)' : 'rgba(79, 172, 254, 0.4)'};
  text-align: center;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
  position: relative;
  overflow: hidden;
  transform-style: preserve-3d;

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
      ${props =>
        props.model === 'bilstm' ? 'rgba(156, 39, 176, 0.1)' :
        props.model === 'Random Forest' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(79, 172, 254, 0.1)'},
      transparent
    );
    animation: shine 3s infinite;
  }

  h3 {
    margin-top: 0;
    color: ${props =>
      props.model === 'bilstm' ? 'rgba(186, 104, 200, 0.9)' :
      props.model === 'Random Forest' ? 'rgba(76, 175, 80, 0.9)' : 'rgba(79, 172, 254, 0.9)'};
    font-size: 1.8rem;
    margin-bottom: 2rem;
    text-transform: uppercase;
    letter-spacing: 2px;
    text-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
    font-family: 'Orbitron', sans-serif;
  }

  p {
    font-size: 1.4rem;
    margin: 1.5rem 0;
    color: #fff;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    font-family: 'Rajdhani', sans-serif;
    font-weight: 600;
  }

  span.metric-value {
    font-weight: 700;
    color: ${props =>
      props.model === 'bilstm' ? 'rgba(186, 104, 200, 0.9)' :
      props.model === 'Random Forest' ? 'rgba(76, 175, 80, 0.9)' : 'rgba(79, 172, 254, 0.9)'};
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
  }
`;

const CyberPlotToggle = styled.div`
  display: flex;
  gap: 2rem;
  justify-content: center;
  margin-bottom: 3rem;
  flex-wrap: wrap;
  transform-style: preserve-3d;
`;

const CyberPlotToggleButton = styled(motion.button)`
  background: ${props => props.active ?
    props.model === 'bilstm' ? 'linear-gradient(145deg, #9c27b0, #673ab7)' :
    props.model === 'transformer' ? 'linear-gradient(145deg, #FF6B6B, #FF8E53)' :
    props.model === 'Random Forest' ? 'linear-gradient(145deg, #4CAF50, #2E7D32)' : 
    'linear-gradient(145deg, #4facfe, #00f2fe)' :
    'rgba(255, 255, 255, 0.05)'};
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  font-weight: 700;
  box-shadow: ${props => props.active ? 
    props.model === 'bilstm' ? '0 10px 30px rgba(156, 39, 176, 0.6)' :
    props.model === 'transformer' ? '0 10px 30px rgba(255, 107, 107, 0.6)' :
    props.model === 'Random Forest' ? '0 10px 30px rgba(76, 175, 80, 0.6)' : '0 10px 30px rgba(79, 172, 254, 0.6)' : 
    '0 5px 15px rgba(0, 0, 0, 0.2)'};
  border: ${props => props.active ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)'};
  min-width: 200px;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-family: 'Rajdhani', sans-serif;
  position: relative;
  overflow: hidden;
  z-index: 1;

  &:hover {
    transform: translateY(-5px) scale(1.05);
    box-shadow: ${props => props.active ? 
      props.model === 'bilstm' ? '0 15px 40px rgba(156, 39, 176, 0.8)' :
      props.model === 'transformer' ? '0 15px 40px rgba(255, 107, 107, 0.8)' :
      props.model === 'Random Forest' ? '0 15px 40px rgba(76, 175, 80, 0.8)' : '0 15px 40px rgba(79, 172, 254, 0.8)' :
      '0 10px 25px rgba(0, 0, 0, 0.3)'};
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      145deg,
      ${props => props.model === 'bilstm' ? 'rgba(156, 39, 176, 0.3)' :
      props.model === 'transformer' ? 'rgba(255, 107, 107, 0.3)' :
      props.model === 'Random Forest' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(79, 172, 254, 0.3)'},
      transparent
    );
    z-index: -1;
    opacity: ${props => props.active ? '1' : '0'};
    transition: opacity 0.4s ease;
  }
`;

const CyberPredictionTable = styled(motion.div)`
  margin-top: 4rem;
  overflow-x: auto;
  background: rgba(30, 42, 58, 0.6);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
  position: relative;
  transform-style: preserve-3d;
  border: 1px solid rgba(255, 255, 255, 0.15);

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
      rgba(255, 255, 255, 0.03),
      transparent
    );
    animation: shine 3s infinite;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th, td {
    padding: 1.5rem 2rem;
    border: 1px solid rgba(255, 255, 255, 0.15);
    text-align: center;
    font-family: 'Rajdhani', sans-serif;
  }

  th {
    background: ${props =>
      props.model === 'bilstm' ? 'rgba(156, 39, 176, 0.4)' :
      props.model === 'Random Forest' ? 'rgba(76, 175, 80, 0.4)' : 'rgba(79, 172, 254, 0.4)'};
    color: ${props =>
      props.model === 'bilstm' ? 'rgba(255, 255, 255, 0.9)' :
      props.model === 'Random Forest' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.9)'};
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 1.1rem;
    position: sticky;
    top: 0;
  }

  tr:nth-child(even) {
    background: rgba(255, 255, 255, 0.08);
  }

  tr:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: scale(1.01);
  }

  td {
    font-weight: 600;
    color: rgba(255, 255, 255, 0.8);
  }
`;

const CyberPlotGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  margin-top: 40px;
  transform-style: preserve-3d;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const CyberPlotCard = styled(motion.div)`
  background: #121212;
  padding: 25px;
  border-radius: 20px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
  transform-style: preserve-3d;
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);

  &:hover {
    transform: translateY(-10px) rotateX(1deg) rotateY(1deg);
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 5px;
    background: linear-gradient(90deg,
      ${props => props.model === 'bilstm' ? '#9c27b0' :
      props.model === 'transformer' ? '#FF6B6B' :
      props.model === 'Random Forest' ? '#4CAF50' : '#4facfe'},
      transparent);
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      45deg,
      transparent,
      rgba(255, 255, 255, 0.03),
      transparent
    );
    animation: shine 3s infinite;
  }
`;

const CyberModelDescription = styled(motion.div)`
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  margin-bottom: 3rem;
  font-size: 1.3rem;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.8;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
  font-family: 'Rajdhani', sans-serif;
  font-weight: 500;
`;

const CyberExportButton = styled(motion.button)`
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.8rem 1.5rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  font-weight: 600;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-left: auto;
  margin-bottom: 1.5rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-family: 'Rajdhani', sans-serif;
  position: relative;
  overflow: hidden;
  z-index: 1;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: translateY(-3px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  }

  svg {
    width: 18px;
    height: 18px;
    fill: currentColor;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      to right,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transform: translateX(-100%);
    transition: transform 0.6s ease;
    z-index: -1;
  }

  &:hover::after {
    transform: translateX(100%);
  }
`;

const CyberPlotHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;

  h4 {
    margin: 0;
    color: ${props =>
      props.model === 'bilstm' ? 'rgba(186, 104, 200, 0.9)' :
      props.model === 'Random Forest' ? 'rgba(76, 175, 80, 0.9)' : 'rgba(79, 172, 254, 0.9)'};
    font-size: 1.5rem;
    text-transform: uppercase;
    letter-spacing: 2px;
    font-family: 'Orbitron', sans-serif;
    text-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
  }
`;

const CyberR2Badge = styled.div`
  display: inline-flex;
  align-items: center;
  background: ${props => 
    props.value < 0 ? 'rgba(255, 107, 107, 0.3)' :
    props.value < 0.5 ? 'rgba(248, 214, 107, 0.3)' :
    'rgba(107, 255, 107, 0.3)'};
  color: ${props => 
    props.value < 0 ? '#ff6b6b' :
    props.value < 0.5 ? '#f8d66b' :
    '#6bff6b'};
  padding: 0.5rem 1.2rem;
  border-radius: 25px;
  font-weight: 700;
  font-size: 1.1rem;
  margin-left: 1.5rem;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  text-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
  font-family: 'Rajdhani', sans-serif;
`;

const CyberActionBar = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
`;

const CyberTableExportButton = styled(CyberExportButton)`
  background: ${props =>
    props.model === 'bilstm' ? 'rgba(156, 39, 176, 0.3)' :
    props.model === 'Random Forest' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(79, 172, 254, 0.3)'};
  border-color: ${props =>
    props.model === 'bilstm' ? 'rgba(156, 39, 176, 0.5)' :
    props.model === 'Random Forest' ? 'rgba(76, 175, 80, 0.5)' : 'rgba(79, 172, 254, 0.5)'};
`;

const CyberPlotExportButton = styled(CyberExportButton)`
  background: ${props =>
    props.model === 'bilstm' ? 'rgba(156, 39, 176, 0.3)' :
    props.model === 'Random Forest' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(79, 172, 254, 0.3)'};
  border-color: ${props =>
    props.model === 'bilstm' ? 'rgba(156, 39, 176, 0.5)' :
    props.model === 'Random Forest' ? 'rgba(76, 175, 80, 0.5)' : 'rgba(79, 172, 254, 0.5)'};
`;

const ParticleBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: -1;
`;

const Particle = styled.div`
  position: absolute;
  width: 2px;
  height: 2px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  animation: ${particleAnimation} 5s linear infinite;
`;

const generateParticles = (count) => {
  const particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      tx: `${(Math.random() - 0.5) * 200}px`,
      ty: `${(Math.random() - 0.5) * 200}px`,
      delay: `${Math.random() * 5}s`,
      size: `${Math.random() * 3 + 1}px`,
      opacity: Math.random() * 0.5 + 0.1
    });
  }
  return particles;
};

const particles = generateParticles(50);

function ResultsPage({ results }) {
  const [file, setFile] = useState(null);
  const windowSize = 10;
  const [targetVariable, setTargetVariable] = useState("");
  const [response, setResponse] = useState(results);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [activePlotType, setActivePlotType] = useState("time_series");
  const [activeModel, setActiveModel] = useState("xgboost");
  const [particlesVisible, setParticlesVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setParticlesVisible(prev => !prev);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
      setSuccess(false);
      setResponse(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: '.csv',
    maxFiles: 1
  });

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a CSV file first");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append("file", file);

    try {
      let endpoint;
      switch (activeModel) {
        case 'transformer':
          endpoint = "http://localhost:8000/api/analyze/transformer/predict";
          break;
        case 'bilstm':
          endpoint = "http://localhost:8000/api/analyze/bilstm/predict";
          break;
        case 'Random Forest':
          endpoint = "http://localhost:8000/api/analyze/rf/predict";
          break;
        default:
          endpoint = "http://localhost:8000/api/analyze/xgboost/predict";
      }

      const res = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data) {
        const modelResponse = activeModel === 'transformer' ? res.data : (res.data.results || res.data);
        setResponse(modelResponse);

        setSuccess(true);
        if (res.data.results && res.data.results.future_past_predictions) {
          const targets = Object.keys(res.data.results.future_past_predictions);
          if (targets.length > 0) {
            setTargetVariable(targets[0]);
          }
        }
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Analysis failed. Please check your file and try again.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const exportPlotAsPNG = async (plotId) => {
    try {
      const element = document.getElementById(plotId);
      if (!element) {
        console.error("Plot element not found");
        return;
      }
      
      const canvas = await html2canvas(element);
      canvas.toBlob((blob) => {
        saveAs(blob, `${activeModel}_${targetVariable || 'plot'}.png`);
      });
    } catch (error) {
      console.error("Error exporting plot:", error);
    }
  };

  const exportTableAsCSV = () => {
    if (!response?.future_past_predictions) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add headers
    const headers = ["Year", ...Object.keys(response.future_past_predictions)];
    csvContent += headers.join(",") + "\r\n";
    
    // Add data rows
    response.years.forEach((year, idx) => {
      const row = [Math.round(year)];
      Object.values(response.future_past_predictions).forEach(values => {
        row.push(values[idx]?.toFixed(4) || "");
      });
      csvContent += row.join(",") + "\r\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeModel}_predictions.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderTransformer = () => {
  if (activeModel !== "transformer" || !response) return null;

  // Get the first target variable if none is selected
  const targets = response.predictions ? Object.keys(response.predictions) : [];
  const currentTarget = targetVariable || (targets.length > 0 ? targets[0] : "");
  
  if (!currentTarget || !response.predictions?.[currentTarget]) {
    return (
      <CyberErrorMessage
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h4>NO PREDICTIONS GENERATED</h4>
        <p>CHECK IF:</p>
        <ul style={{ 
          textAlign: 'left', 
          display: 'inline-block', 
          margin: '1.5rem 0',
          listStyleType: 'none',
          padding: 0
        }}>
          <li>• YOUR DATA CONTAINS THE REQUIRED TARGET VARIABLES</li>
          <li>• YOU HAVE ENOUGH DATA POINTS</li>
          <li>• THE FILE FORMAT IS CORRECT</li>
        </ul>
      </CyberErrorMessage>
    );
  }

  const targetData = response.predictions[currentTarget];
  const metrics = response.metrics?.[currentTarget] || {};
  const plots = response.plots?.[currentTarget] || {};

  return (
    <>
      <CyberTargetSelector model={activeModel}>
        <label>SELECT TARGET VARIABLE</label>
        <select 
          value={currentTarget} 
          onChange={(e) => setTargetVariable(e.target.value)}
        >
          {targets.map(target => (
            <option key={target} value={target}>
              {target.replace(/_/g, ' ').toUpperCase()}
            </option>
          ))}
        </select>
      </CyberTargetSelector>

      <CyberPlotToggle>
        <CyberPlotToggleButton 
          onClick={() => setActivePlotType('prediction')} 
          active={activePlotType === 'prediction'} 
          model={activeModel}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          PREDICTION PLOT
        </CyberPlotToggleButton>
        <CyberPlotToggleButton 
          onClick={() => setActivePlotType('residual')} 
          active={activePlotType === 'residual'} 
          model={activeModel}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          RESIDUAL ANALYSIS
        </CyberPlotToggleButton>
        <CyberPlotToggleButton 
          onClick={() => setActivePlotType('qq')} 
          active={activePlotType === 'qq'} 
          model={activeModel}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          QQ PLOT
        </CyberPlotToggleButton>
      </CyberPlotToggle>

      <CyberPlotContainer>
        {activePlotType === 'prediction' && plots.prediction_plot && (
          <CyberPlotCard 
            model={activeModel} 
            id={`prediction-plot-${currentTarget}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <CyberPlotHeader model={activeModel}>
              <h4>{`${currentTarget.replace(/_/g, ' ').toUpperCase()} PREDICTIONS`}</h4>
              {metrics.r2 && (
                <div>
                  <span>R²:</span>
                  <CyberR2Badge value={metrics.r2}>
                    {metrics.r2.toFixed(3)}
                  </CyberR2Badge>
                </div>
              )}
            </CyberPlotHeader>
            <img
              src={`data:image/png;base64,${plots.prediction_plot}`}
              alt={`${currentTarget} predictions`}
              style={{ 
                width: '100%', 
                height: 'auto',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            />
            <CyberActionBar>
              <CyberPlotExportButton 
                onClick={() => exportPlotAsPNG(`prediction-plot-${currentTarget}`)}
                model={activeModel}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M19 12v7H5v-7H3v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7z"/>
                  <path d="M13 12.67V3h-2v9.67l-2.59-2.58L7 11l5 5 5-5-1.41-1.41z"/>
                </svg>
                EXPORT PLOT
              </CyberPlotExportButton>
            </CyberActionBar>
          </CyberPlotCard>
        )}

        {activePlotType === 'residual' && plots.residual_plot && (
          <CyberPlotCard 
            model={activeModel} 
            id={`residual-plot-${currentTarget}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <CyberPlotHeader model={activeModel}>
              <h4>{`${currentTarget.replace(/_/g, ' ').toUpperCase()} RESIDUALS`}</h4>
            </CyberPlotHeader>
            <img
              src={`data:image/png;base64,${plots.residual_plot}`}
              alt={`${currentTarget} residuals`}
              style={{ 
                width: '100%', 
                height: 'auto',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            />
            <CyberActionBar>
              <CyberPlotExportButton 
                onClick={() => exportPlotAsPNG(`residual-plot-${currentTarget}`)}
                model={activeModel}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M19 12v7H5v-7H3v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7z"/>
                  <path d="M13 12.67V3h-2v9.67l-2.59-2.58L7 11l5 5 5-5-1.41-1.41z"/>
                </svg>
                EXPORT PLOT
              </CyberPlotExportButton>
            </CyberActionBar>
          </CyberPlotCard>
        )}

        {activePlotType === 'qq' && plots.qq_plot && (
          <CyberPlotCard 
            model={activeModel} 
            id={`qq-plot-${currentTarget}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <CyberPlotHeader model={activeModel}>
              <h4>{`${currentTarget.replace(/_/g, ' ').toUpperCase()} QQ PLOT`}</h4>
            </CyberPlotHeader>
            <img
              src={`data:image/png;base64,${plots.qq_plot}`}
              alt={`${currentTarget} QQ plot`}
              style={{ 
                width: '100%', 
                height: 'auto',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            />
            <CyberActionBar>
              <CyberPlotExportButton 
                onClick={() => exportPlotAsPNG(`qq-plot-${currentTarget}`)}
                model={activeModel}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M19 12v7H5v-7H3v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7z"/>
                  <path d="M13 12.67V3h-2v9.67l-2.59-2.58L7 11l5 5 5-5-1.41-1.41z"/>
                </svg>
                EXPORT PLOT
              </CyberPlotExportButton>
            </CyberActionBar>
          </CyberPlotCard>
        )}
      </CyberPlotContainer>

      <CyberResultCard 
        model={activeModel}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h3>{currentTarget.replace(/_/g, ' ').toUpperCase()} METRICS</h3>
        <p>
          <span>R² SCORE:</span>
          <span className="metric-value">{metrics.r2?.toFixed(4) || 'N/A'}</span>
        </p>
        <p>
          <span>MAE:</span>
          <span className="metric-value">{metrics.mae?.toFixed(4) || 'N/A'}</span>
        </p>
        <p>
          <span>RMSE:</span>
          <span className="metric-value">{metrics.rmse?.toFixed(4) || 'N/A'}</span>
        </p>
      </CyberResultCard>

      {targetData.actual && targetData.predictions && (
        <CyberPredictionTable 
          model={activeModel}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <h3 style={{ 
              color: getModelColor(activeModel), 
              margin: 0,
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '1.8rem',
              textTransform: 'uppercase',
              letterSpacing: '2px'
            }}>
              PREDICTION DETAILS
            </h3>
          </div>
          <table>
            <thead>
              <tr>
                <th>INDEX</th>
                <th>ACTUAL</th>
                <th>PREDICTED</th>
                <th>DIFFERENCE</th>
              </tr>
            </thead>
            <tbody>
              {targetData.actual.slice(0, 20).map((actual, idx) => {
                const predicted = targetData.predictions[idx];
                const diff = predicted - actual;
                const absDiff = Math.abs(diff);
                
                return (
                  <tr 
                    key={`${currentTarget}-${idx}`} 
                    whileHover={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      scale: 1.01
                    }}
                  >
                    <td>{idx + 1}</td>
                    <td>{actual?.toFixed(4)}</td>
                    <td>{predicted?.toFixed(4)}</td>
                    <td style={{ 
                      color: absDiff > 1 ? '#ff6b6b' :
                            absDiff > 0.5 ? '#f8d66b' : '#6bff6b',
                      fontWeight: '700'
                    }}>
                      {diff?.toFixed(4)}
                    </td>
                  </tr>
                );
              })}
              {targetData.actual.length > 20 && (
                <tr>
                  <td colSpan={4}>
                    ... SHOWING FIRST 20 OF {targetData.actual.length} PREDICTIONS
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CyberPredictionTable>
      )}
    </>
  );
};

  const renderTimeSeriesPlot = () => {
    if (!response?.time_series_plot) return null;
    return (
      <CyberPlotCard 
        model={activeModel} 
        id="time-series-plot"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <CyberPlotHeader model={activeModel}>
          <h4>TIME SERIES PREDICTION</h4>
          {response.training_metrics?.[targetVariable]?.r2 && (
            <div>
              <span>R²:</span>
              <CyberR2Badge value={response.training_metrics[targetVariable].r2}>
                {response.training_metrics[targetVariable].r2.toFixed(3)}
              </CyberR2Badge>
            </div>
          )}
        </CyberPlotHeader>
        <img
          src={`data:image/png;base64,${response.time_series_plot}`}
          alt="Time series prediction"
          style={{ 
            width: '100%', 
            height: 'auto',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        />
        <CyberActionBar>
          <CyberPlotExportButton 
            onClick={() => exportPlotAsPNG("time-series-plot")}
            model={activeModel}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M19 12v7H5v-7H3v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7z"/>
              <path d="M13 12.67V3h-2v9.67l-2.59-2.58L7 11l5 5 5-5-1.41-1.41z"/>
            </svg>
            EXPORT PLOT
          </CyberPlotExportButton>
        </CyberActionBar>
      </CyberPlotCard>
    );
  };

  const renderTargetPlots = () => {
    if (!response?.plots || !targetVariable) return null;
    const targetPlots = response.plots[targetVariable];
    if (!targetPlots) return null;

    return (
      <CyberPlotGrid>
        {Object.entries(targetPlots).map(([plotType, plotData]) => (
          <CyberPlotCard 
            key={plotType} 
            model={activeModel} 
            id={`${targetVariable}-${plotType}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <CyberPlotHeader model={activeModel}>
              <h4>{`${targetVariable.replace(/_/g, ' ').toUpperCase()} ${plotType.replace('_', ' ').toUpperCase()}`}</h4>
            </CyberPlotHeader>
            <img
              src={`data:image/png;base64,${plotData}`}
              alt={`${targetVariable} ${plotType.replace('_', ' ')}`}
              style={{ 
                width: '100%', 
                height: 'auto',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            />
            <CyberActionBar>
              <CyberPlotExportButton 
                onClick={() => exportPlotAsPNG(`${targetVariable}-${plotType}`)}
                model={activeModel}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M19 12v7H5v-7H3v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7z"/>
                  <path d="M13 12.67V3h-2v9.67l-2.59-2.58L7 11l5 5 5-5-1.41-1.41z"/>
                </svg>
                EXPORT PLOT
              </CyberPlotExportButton>
            </CyberActionBar>
          </CyberPlotCard>
        ))}
      </CyberPlotGrid>
    );
  };

  const renderResults = () => {
    if (activeModel === 'transformer') {
      return renderTransformer();
    }

    if (!response?.future_past_predictions) return null;

    const renderTimeSeriesOrTargetPlots = () => {
      if (activePlotType === 'time_series') {
        return renderTimeSeriesPlot();
      } else {
        return renderTargetPlots();
      }
    };

    const renderMetrics = () => {
      if (targetVariable && response.training_metrics?.[targetVariable]) {
        return (
          <CyberResultCard 
            model={activeModel}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h3>{targetVariable.replace(/_/g, ' ').toUpperCase()} METRICS</h3>
            <p>
              <span>R² SCORE:</span>
              <span className="metric-value">{response.training_metrics[targetVariable].r2.toFixed(4)}</span>
            </p>
            <p>
              <span>MAE:</span>
              <span className="metric-value">{response.evaluation_metrics?.[targetVariable]?.mae?.toFixed(4) || 'N/A'}</span>
            </p>
            <p>
              <span>RMSE:</span>
              <span className="metric-value">{response.evaluation_metrics?.[targetVariable]?.rmse?.toFixed(4) || 'N/A'}</span>
            </p>
            {response.training_cross_validation?.[targetVariable] && (
              <p>
                <span>MEAN CV SCORE:</span>
                <span className="metric-value">{response.training_cross_validation[targetVariable].mean_cv_score.toFixed(4)}</span>
              </p>
            )}
          </CyberResultCard>
        );
      }
      return null;
    };

    const renderPredictionTable = () => {
      if (!response.years || !response.future_past_predictions) return null;

      return (
        <CyberPredictionTable 
          model={activeModel}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <h3 style={{ 
              color: getModelColor(activeModel), 
              margin: 0,
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '1.8rem',
              textTransform: 'uppercase',
              letterSpacing: '2px'
            }}>
              PREDICTION DATA
            </h3>
            <CyberTableExportButton 
              onClick={exportTableAsCSV} 
              model={activeModel}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M19 12v7H5v-7H3v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7z"/>
                <path d="M13 12.67V3h-2v9.67l-2.59-2.58L7 11l5 5 5-5-1.41-1.41z"/>
              </svg>
              EXPORT CSV
            </CyberTableExportButton>
          </div>
          <table>
            <thead>
              <tr>
                <th>YEAR</th>
                {Object.keys(response.future_past_predictions).map(target => (
                  <th key={target}>{target.replace(/_/g, ' ').toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {response.years.slice(0, 20).map((year, idx) => (
                <tr 
                  key={idx}
                  whileHover={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    scale: 1.01
                  }}
                >
                  <td>{Math.round(year)}</td>
                  {Object.values(response.future_past_predictions).map((values, i) => (
                    <td key={i}>{values[idx]?.toFixed(4)}</td>
                  ))}
                </tr>
              ))}
              {response.years.length > 20 && (
                <tr>
                  <td colSpan={Object.keys(response.future_past_predictions).length + 1}>
                    ... SHOWING FIRST 20 OF {response.years.length} PREDICTIONS
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CyberPredictionTable>
      );
    };

    return (
      <div style={{ width: '100%' }}>
        <CyberTargetSelector model={activeModel}>
          <label>SELECT TARGET VARIABLE</label>
          <select value={targetVariable} onChange={(e) => setTargetVariable(e.target.value)}>
            {Object.keys(response.future_past_predictions).map(target => (
              <option key={target} value={target}>
                {target.replace(/_/g, ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </CyberTargetSelector>

        <CyberPlotToggle>
          <CyberPlotToggleButton 
            onClick={() => setActivePlotType('time_series')} 
            active={activePlotType === 'time_series'} 
            model={activeModel}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            TIME SERIES
          </CyberPlotToggleButton>
          {response.plots && (
            <CyberPlotToggleButton 
              onClick={() => setActivePlotType('target_plots')} 
              active={activePlotType === 'target_plots'} 
              model={activeModel}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              TARGET ANALYSIS
            </CyberPlotToggleButton>
          )}
        </CyberPlotToggle>

        <CyberPlotContainer>
          {renderTimeSeriesOrTargetPlots()}
        </CyberPlotContainer>

        {renderMetrics()}

        {renderPredictionTable()}
      </div>
    );
  };

  const getModelDescription = () => {
    switch (activeModel) {
      case 'transformer':
        return "The TRANSFORMER model harnesses cutting-edge self-attention mechanisms to capture long-range dependencies and complex patterns in your time series data. This quantum-inspired architecture delivers unparalleled predictive accuracy by analyzing temporal relationships across your entire dataset simultaneously.";
      case 'bilstm':
        return "Our BILSTM (Bidirectional Long Short-Term Memory) neural network processes data in both temporal directions, creating a holographic memory matrix that captures past and future context simultaneously. Ideal for sequence prediction tasks requiring deep temporal understanding and pattern recognition.";
      case 'Random Forest':
        return "The RANDOM FOREST algorithm constructs a multidimensional decision tree ensemble in our quantum computing cluster. This hyper-optimized implementation provides robust predictions while automatically calculating feature importance metrics, making it perfect for high-dimensional datasets.";
      default:
        return "XGBOOST is our hyper-optimized gradient boosting implementation running on distributed quantum cores. This state-of-the-art model handles missing values automatically, includes advanced regularization, and delivers predictive performance that approaches theoretical limits for structured data.";
    }
  };

  const getModelTitle = () => {
    switch (activeModel) {
      case 'transformer':
        return 'QUANTUM TRANSFORMER ANALYSIS';
      case 'bilstm':
        return 'NEURAL BILSTM ANALYSIS';
      case 'Random Forest':
        return 'HYPERFOREST PREDICTION';
      default:
        return 'XGBOOST QUANTUM EDITION';
    }
  };

  const getModelColor = (model) => {
    switch (model) {
      case 'bilstm': return 'rgba(186, 104, 200, 0.9)';
      case 'Random Forest': return 'rgba(76, 175, 80, 0.9)';
      case 'transformer': return 'rgba(255, 142, 83, 0.9)';
      default: return 'rgba(79, 172, 254, 0.9)';
    }
  };

  return (
    <QuantumContainer>
      <ParticleBackground>
        {particlesVisible && particles.map(particle => (
          <Particle
            key={particle.id}
            style={{
              left: particle.left,
              top: particle.top,
              '--tx': particle.tx,
              '--ty': particle.ty,
              animationDelay: particle.delay,
              width: particle.size,
              height: particle.size,
              opacity: particle.opacity
            }}
          />
        ))}
      </ParticleBackground>
      
      <HolographicCard>
        <CyberTitle
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {getModelTitle()}
        </CyberTitle>
        
        <CyberModelDescription
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {getModelDescription()}
        </CyberModelDescription>

        <ModelSelector>
          <CyberButton 
            onClick={() => setActiveModel('xgboost')} 
            active={activeModel === 'xgboost'} 
            model="xgboost"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            XGBOOST
          </CyberButton>
          <CyberButton 
            onClick={() => setActiveModel('Random Forest')} 
            active={activeModel === 'Random Forest'} 
            model="Random Forest"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            RANDOM FOREST
          </CyberButton>
          <CyberButton 
            onClick={() => setActiveModel('transformer')} 
            active={activeModel === 'transformer'} 
            model="transformer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            TRANSFORMER
          </CyberButton>
          <CyberButton 
            onClick={() => setActiveModel('bilstm')} 
            active={activeModel === 'bilstm'} 
            model="bilstm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            BILSTM
          </CyberButton>
        </ModelSelector>

        <CyberDropzone 
          {...getRootProps()} 
          isDragActive={isDragActive} 
          model={activeModel}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <CyberDropzoneText isDragActive model={activeModel}>
              DROP CSV FILE HERE
            </CyberDropzoneText>
          ) : (
            <CyberDropzoneText model={activeModel}>
              DRAG & DROP A CSV FILE, OR CLICK TO SELECT
            </CyberDropzoneText>
          )}
          {file && (
            <CyberFileName 
              model={activeModel}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              SELECTED: {file.name}
            </CyberFileName>
          )}
        </CyberDropzone>

        <CyberUploadButton 
          onClick={handleUpload} 
          disabled={!file || loading} 
          model={activeModel}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={!file || loading ? {} : { scale: 1.05 }}
          whileTap={!file || loading ? {} : { scale: 0.95 }}
        >
          {loading ? (
            <>
              <PulseLoader color="#ffffff" size={10} margin={4} />
              <span style={{ marginLeft: '12px' }}>PROCESSING</span>
            </>
          ) : `RUN ${getModelTitle()}`}
        </CyberUploadButton>

        <AnimatePresence>
          {error && (
            <CyberErrorMessage
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5 }}
            >
              {error}
            </CyberErrorMessage>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {success && (
            <CyberSuccessMessage 
              model={activeModel}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
            >
              {activeModel === 'transformer'
                ? "TRANSFORMER ANALYSIS COMPLETED! VIEW PREDICTIONS BELOW."
                : `${getModelTitle()} COMPLETED SUCCESSFULLY!`}
            </CyberSuccessMessage>
          )}
        </AnimatePresence>

        {loading ? (
          <CyberLoadingContainer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <PulseLoader 
              color={getModelColor(activeModel)} 
              size={25} 
              margin={10} 
            />
            <CyberLoadingText>
              TRAINING {getModelTitle()} MODEL...
            </CyberLoadingText>
            <CyberLoadingText>
              QUANTUM COMPUTATION IN PROGRESS. THIS MAY TAKE SEVERAL MINUTES DEPENDING ON DATA COMPLEXITY.
            </CyberLoadingText>
          </CyberLoadingContainer>
        ) : (
          renderResults()
        )}
      </HolographicCard>
    </QuantumContainer>
  );
}

export default ResultsPage;