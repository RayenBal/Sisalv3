import React, { useEffect, useState, useMemo } from "react";
import { getResiduals } from "../services/api";
import Plot from "react-plotly.js";
import styled, { keyframes } from "styled-components";
import { fadeIn } from 'react-animations';
import { PulseLoader } from 'react-spinners';

// Animations
const fadeInAnimation = keyframes`${fadeIn}`;

// Styled Components
const Container = styled.div`
  max-width: 1400px;
  margin: 2rem auto;
  padding: 0 1rem;
  animation: ${fadeInAnimation} 0.5s ease-in;
  font-family: 'Segoe UI', 'Roboto', sans-serif;
`;

const Card = styled.div`
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
  border-radius: 20px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  transition: all 0.3s ease;
  padding: 2.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
`;

const Title = styled.h2`
  margin: 0 0 1.5rem 0;
  color: #fff;
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  background: linear-gradient(90deg, #00dbde, #fc00ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 1px;
  text-shadow: 0 0 20px rgba(0, 219, 222, 0.3);
  position: relative;

  &::after {
    content: '';
    display: block;
    width: 100px;
    height: 3px;
    background: linear-gradient(90deg, #00dbde, #fc00ff);
    margin: 1rem auto 0;
    border-radius: 3px;
  }
`;

const SelectContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2rem;
`;

const SelectLabel = styled.label`
  color: #4facfe;
  font-size: 1.1rem;
  font-weight: 600;
`;

const Select = styled.select`
  appearance: none;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(79, 172, 254, 0.5);
  border-radius: 8px;
  padding: 0.8rem 2rem 0.8rem 1rem;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3e%3cpath d='M7 10l5 5 5-5z'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.7rem center;
  background-size: 1rem;
  min-width: 200px;

  &:hover {
    border-color: rgba(79, 172, 254, 0.7);
    box-shadow: 0 0 0 3px rgba(79, 172, 254, 0.2);
  }

  &:focus {
    outline: none;
    border-color: #4facfe;
    box-shadow: 0 0 0 3px rgba(79, 172, 254, 0.3);
  }
`;

const Option = styled.option`
  background: #1a1a2e;
  color: white;
`;

const PlotContainer = styled.div`
  margin-top: 2rem;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
  background: #121212;
  width: 100%;
  height: 500px;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
`;

const ErrorMessage = styled.div`
  color: #ff6b81;
  text-align: center;
  padding: 2rem;
  background: rgba(255, 107, 129, 0.1);
  border-radius: 16px;
  margin: 2rem 0;
  border: 1px solid rgba(255, 107, 129, 0.3);
  font-size: 1.1rem;
  box-shadow: 0 5px 15px rgba(255, 107, 129, 0.2);
`;

const NoDataMessage = styled.div`
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  margin: 2rem 0;
`;

function ResidualsPage({ model }) {
  const [residuals, setResiduals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [target, setTarget] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getResiduals(model)
      .then((response) => {
        setResiduals(response.data);
        const targets = response.data.length > 0 ? Object.keys(response.data[0]) : [];
        if (targets.length > 0) {
          setTarget(targets[0]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching residuals:", err);
        setError(err.message || "Failed to load residuals data");
        setLoading(false);
      });
  }, [model]);

  const handleTargetChange = (e) => {
    setTarget(e.target.value);
  };

  const plotData = useMemo(() => {
    if (!target || residuals.length === 0) return null;
    const data = residuals.map(r => r[target]);
    return [{
      type: "histogram",
      x: data,
      marker: {
        color: '#4facfe',
        line: {
          color: '#00f2fe',
          width: 1
        }
      },
      opacity: 0.7,
      name: 'Residuals'
    }];
  }, [residuals, target]);

  const plotLayout = useMemo(() => ({
    plot_bgcolor: "#121212",
    paper_bgcolor: "#121212",
    font: { color: "#ffffff" },
    title: {
      text: target ? `Residuals Distribution - ${target}` : 'Residuals Distribution',
      font: {
        size: 20,
        color: '#ffffff'
      }
    },
    margin: { t: 50, b: 50, l: 50, r: 50 },
    xaxis: {
      title: {
        text: 'Residual Values',
        font: {
          size: 14,
          color: '#ffffff'
        }
      },
      gridcolor: 'rgba(255, 255, 255, 0.1)'
    },
    yaxis: {
      title: {
        text: 'Frequency',
        font: {
          size: 14,
          color: '#ffffff'
        }
      },
      gridcolor: 'rgba(255, 255, 255, 0.1)'
    },
    hoverlabel: {
      bgcolor: '#1a1a2e',
      font: {
        color: '#ffffff'
      }
    },
    bargap: 0.1
  }), [target]);

  const targets = residuals.length > 0 ? Object.keys(residuals[0]) : [];

  return (
    <Container>
      <Card>
        <Title>
          Residuals Analysis <span>{model.toUpperCase()}</span>
        </Title>

        {targets.length > 0 && (
          <SelectContainer>
            <SelectLabel>Target:</SelectLabel>
            <Select value={target || ""} onChange={handleTargetChange}>
              {targets.map(t => (
                <Option key={t} value={t}>{t}</Option>
              ))}
            </Select>
          </SelectContainer>
        )}

        {loading ? (
          <LoadingContainer>
            <PulseLoader color="#4facfe" size={15} margin={5} />
          </LoadingContainer>
        ) : error ? (
          <ErrorMessage>{error}</ErrorMessage>
        ) : targets.length === 0 ? (
          <NoDataMessage>No residuals data available</NoDataMessage>
        ) : (
          <PlotContainer>
            <Plot
              data={plotData}
              layout={plotLayout}
              config={{
                displayModeBar: true,
                displaylogo: false,
                responsive: true,
                modeBarButtonsToRemove: ['toImage', 'sendDataToCloud', 'hoverCompareCartesian']
              }}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler={true}
              key={`residuals-plot-${target}`}
            />
          </PlotContainer>
        )}
      </Card>
    </Container>
  );
}

export default ResidualsPage;
