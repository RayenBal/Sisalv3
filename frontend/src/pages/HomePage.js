import React from "react";
import styled, { keyframes } from "styled-components";
import { motion } from "framer-motion";

// Animations
const dataFlow = keyframes`
  0% { transform: translateY(-100%) rotate(0deg); opacity: 0; }
  10% { opacity: 0.8; }
  100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
`;

// Dashboard styling
const DashboardContainer = styled.div`
  max-width: 2000px;
  margin: 0 auto;
  padding: 2rem 3rem;
  font-family: 'Inter', 'Roboto', sans-serif;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  position: relative;
  min-height: 100vh;
`;

const HeroSection = styled(motion.div)`
  width: 100%;
  background: linear-gradient(145deg, #0a0a12 0%, #151525 100%);
  border-radius: 24px;
  padding: 4rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5),
              0 0 100px rgba(0, 102, 204, 0.1) inset;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 60vh;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: linear-gradient(90deg, #9c27b0, #673ab7);
  }
`;

const CardRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2.5rem;
  margin: 3rem 0;
  width: 100%;
`;

const ModelCard = styled(motion.div)`
  background: rgba(20, 20, 35, 0.8);
  border-radius: 18px;
  padding: 2.5rem;
  border: 1px solid ${props => props.modelColor}20;
  backdrop-filter: blur(10px);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
    border-color: ${props => props.modelColor}60;
  }
`;

const ScientificHeading = styled.h1`
  font-size: 3.5rem;
  font-weight: 800;
  background: linear-gradient(90deg, #9c27b0, #673ab7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0 0 1rem 0;
  line-height: 1.1;
  font-family: 'Inter', sans-serif;
  letter-spacing: -0.5px;

  span {
    display: block;
    font-size: 1.8rem;
    font-weight: 500;
    margin-top: 1rem;
    letter-spacing: 0.5px;
    color: rgba(255, 255, 255, 0.9);
    background: none;
    -webkit-text-fill-color: initial;
  }
`;

const SectionHeading = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 2rem 0;
  position: relative;
  display: inline-block;
  width: 100%;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 0;
    width: 60px;
    height: 4px;
    background: linear-gradient(90deg, #9c27b0, #673ab7);
    border-radius: 4px;
  }
`;

const ModelName = styled.h3`
  font-size: 1.6rem;
  font-weight: 700;
  color: ${props => props.color || '#fff'};
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.8rem;

  &::before {
    content: '';
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: ${props => props.color || '#9c27b0'};
    box-shadow: 0 0 10px ${props => props.color || '#9c27b0'};
  }
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 1.5rem 0 0 0;
`;

const FeatureItem = styled.li`
  position: relative;
  padding-left: 1.8rem;
  margin-bottom: 0.8rem;
  color: rgba(255, 255, 255, 0.85);
  font-size: 1.05rem;
  line-height: 1.6;

  &::before {
    content: '▹';
    position: absolute;
    left: 0;
    color: ${props => props.color || '#9c27b0'};
    font-size: 1.2rem;
  }
`;

const ScientificButton = styled(motion.button)`
  background: ${props => props.color === 'purple' 
    ? 'linear-gradient(145deg, #9c27b0, #673ab7)' 
    : props.color === 'orange' 
      ? 'linear-gradient(145deg, #FF6B6B, #FF8E53)' 
      : 'linear-gradient(145deg, #4facfe, #00f2fe)'};
  color: white;
  border: none;
  padding: 1.3rem 3rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  box-shadow: ${props => props.color === 'purple' 
    ? '0 10px 30px rgba(156, 39, 176, 0.6)' 
    : props.color === 'orange' 
      ? '0 10px 30px rgba(255, 107, 107, 0.6)' 
      : '0 10px 30px rgba(79, 172, 254, 0.6)'};
  position: relative;
  overflow: hidden;
  z-index: 1;
  border: 1px solid rgba(255, 255, 255, 0.15);
  margin: 1rem;
  min-width: 220px;
  text-transform: none;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: ${props => props.color === 'purple' 
      ? '0 15px 40px rgba(156, 39, 176, 0.8)' 
      : props.color === 'orange' 
        ? '0 15px 40px rgba(255, 107, 107, 0.8)' 
        : '0 15px 40px rgba(79, 172, 254, 0.8)'};
  }
  
  &:active {
    transform: translateY(1px);
  }

  svg {
    width: 20px;
    height: 20px;
    fill: ${props => props.color === 'purple' 
      ? 'rgba(186, 104, 200, 0.9)' 
      : props.color === 'orange' 
        ? 'rgba(255, 142, 83, 0.9)' 
        : 'rgba(79, 172, 254, 0.9)'};
  }
`;

function HomePage({ setPage }) {
  const modelFeatures = [
    {
      name: "XGBoost",
      color: "#00cc66",
      features: [
        "Handles missing data automatically",
        "Built-in feature importance metrics",
        "Optimized for high performance",
        "Regularization prevents overfitting"
      ]
    },
    {
      name: "Random Forest",
      color: "#cc00ff",
      features: [
        "Robust to noisy features",
        "Natural nonlinear relationships",
        "Out-of-bag error estimation",
        "Parallelizable training"
      ]
    },
    {
      name: "BiLSTM",
      color: "#0066cc",
      features: [
        "Bidirectional temporal analysis",
        "Learns complex autocorrelations",
        "Produces smooth predictions",
        "Ideal for time-series data"
      ]
    },
    {
      name: "Transformer",
      color: "#ff6600",
      features: [
        "Long-range dependency capture",
        "Scalable to 10k+ time steps",
        "Interpretable attention maps",
        "State-of-the-art performance"
      ]
    }
  ];

  return (
    <DashboardContainer>
      <HeroSection
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <ScientificHeading>
          Paleoclimate AI Dashboard
          <span>Advanced Analysis of Speleothem δ¹⁸O Records</span>
        </ScientificHeading>
        
        <p style={{
          color: 'rgba(255, 255, 255, 0.85)',
          fontSize: '1.2rem',
          maxWidth: '800px',
          margin: '2rem auto 3rem',
          lineHeight: '1.8'
        }}>
          A comprehensive analytical platform combining machine learning with geochemical proxies to uncover climate patterns across millennia.
        </p>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem' }}>
          <ScientificButton
            onClick={() => setPage("metrics")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            color="purple"
          >
            View Model Metrics
          </ScientificButton>
          <ScientificButton
            onClick={() => setPage("featureimportance")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            color="orange"
          >
            Feature Importance
          </ScientificButton>
          <ScientificButton
            onClick={() => setPage("predictions")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            color="blue"
          >
            Predictions Explorer
          </ScientificButton>
        </div>
      </HeroSection>

      <SectionHeading>Model Architectures</SectionHeading>
      
      <CardRow>
        {modelFeatures.map((model, index) => (
          <ModelCard
            key={model.name}
            modelColor={model.color}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 + 0.3 }}
            whileHover={{ y: -5 }}
          >
            <ModelName color={model.color}>{model.name}</ModelName>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '1.5rem' }}>
              {model.name === "XGBoost" && "Gradient-boosted decision trees for robust analysis"}
              {model.name === "Random Forest" && "Ensemble method for nonlinear relationships"}
              {model.name === "BiLSTM" && "Recurrent network for temporal dependencies"}
              {model.name === "Transformer" && "Attention mechanism for long-range patterns"}
            </p>
            <FeatureList>
              {model.features.map((feature, i) => (
                <FeatureItem key={i} color={model.color}>
                  {feature}
                </FeatureItem>
              ))}
            </FeatureList>
          </ModelCard>
        ))}
      </CardRow>

      <SectionHeading>Analysis Capabilities</SectionHeading>
      
      <CardRow>
        <ModelCard
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          modelColor="#9c27b0"
        >
          <ModelName color="#9c27b0">Static Reporting</ModelName>
          <FeatureList>
            <FeatureItem color="#9c27b0">Comprehensive metrics tables (R², MAE, RMSE)</FeatureItem>
            <FeatureItem color="#9c27b0">Feature importance rankings</FeatureItem>
            <FeatureItem color="#9c27b0">Residual diagnostics & QQ-plots</FeatureItem>
            <FeatureItem color="#9c27b0">Exportable CSV of all predictions</FeatureItem>
            <FeatureItem color="#9c27b0">Publication-ready visualizations</FeatureItem>
          </FeatureList>
        </ModelCard>

        <ModelCard
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          modelColor="#FF6B6B"
        >
          <ModelName color="#FF6B6B">Dynamic Exploration</ModelName>
          <FeatureList>
            <FeatureItem color="#FF6B6B">Interactive deep-time visualizations</FeatureItem>
            <FeatureItem color="#FF6B6B">Real-time model comparison</FeatureItem>
            <FeatureItem color="#FF6B6B">Zoom & pan through 15,000 years</FeatureItem>
            <FeatureItem color="#FF6B6B">Customizable dashboard views</FeatureItem>
            <FeatureItem color="#FF6B6B">Multi-proxy correlation analysis</FeatureItem>
          </FeatureList>
        </ModelCard>
      </CardRow>
    </DashboardContainer>
  );
}

export default HomePage;