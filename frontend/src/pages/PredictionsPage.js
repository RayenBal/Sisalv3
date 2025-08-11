import React, { useEffect, useState, useMemo } from "react";
import { getPredictions } from "../services/api";
import Plot from "react-plotly.js";
import styled, { keyframes } from "styled-components";
import { fadeIn } from 'react-animations';
import { PulseLoader } from 'react-spinners';

// Animations
const fadeInAnimation = keyframes`${fadeIn}`;

// Styled Components
const Container = styled.div`
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem;
  animation: ${fadeInAnimation} 0.5s ease-in;
`;

const Card = styled.div`
  background: linear-gradient(135deg, #2c3e50 0%, #1a1a2e 100%);
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  transition: all 0.3s ease;
  padding: 2rem;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
  }
`;

const Header = styled.div`
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h2`
  margin: 0;
  color: #fff;
  font-size: 1.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  span {
    background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    font-weight: 700;
  }
`;

const SelectContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const SelectLabel = styled.label`
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
`;

const Select = styled.select`
  appearance: none;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
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
    border-color: rgba(255, 255, 255, 0.3);
    box-shadow: 0 0 0 3px rgba(79, 172, 254, 0.2);
  }
  
  &:focus {
    outline: none;
    border-color: #4facfe;
    box-shadow: 0 0 0 3px rgba(79, 172, 254, 0.3);
  }
`;

const Option = styled.option`
  background: #2c3e50;
  color: white;
`;

const PlotContainer = styled.div`
  margin-top: 2rem;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 100%;
  height: 600px;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
`;

const NoDataMessage = styled.div`
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin-top: 1rem;
`;

function PredictionsPage({ model }) {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [target, setTarget] = useState("d18O_measurement");

  const targets = useMemo(() => [
    "d18O_measurement", 
    "d13C_measurement", 
    "Mg_Ca_measurement", 
    "Sr_Ca_measurement"
  ], []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    getPredictions(model)
      .then((response) => {
        setPredictions(response.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching predictions:", err);
        setError(err.message || "Failed to load predictions data");
        setLoading(false);
      });
  }, [model]);

  const handleTargetChange = (e) => {
    setTarget(e.target.value);
  };

  const plotData = useMemo(() => {
    if (predictions.length === 0) return null;
    
    const years = predictions.map(item => item.year);
    const values = predictions.map(item => item[target]);

    return [{
      type: "scatter",
      mode: "lines+markers",
      x: years,
      y: values,
      marker: {
        color: '#4facfe',
        size: 8,
        line: {
          color: '#00f2fe',
          width: 1
        }
      },
      line: {
        color: '#4facfe',
        width: 2
      },
      name: target
    }];
  }, [predictions, target]);

  const plotLayout = useMemo(() => ({
    plot_bgcolor: "#121212",
    paper_bgcolor: "#121212",
    font: { color: "#ffffff" },
    title: {
      text: `Predictions - ${target}`,
      font: {
        size: 16,
        color: '#ffffff'
      }
    },
    xaxis: {
      title: {
        text: "Year",
        font: {
          size: 14,
          color: '#ffffff'
        }
      },
      gridcolor: 'rgba(255, 255, 255, 0.1)'
    },
    yaxis: {
      title: {
        text: target,
        font: {
          size: 14,
          color: '#ffffff'
        }
      },
      gridcolor: 'rgba(255, 255, 255, 0.1)'
    },
    margin: { t: 80, b: 80, l: 80, r: 50 },
    hoverlabel: {
      bgcolor: '#1a1a2e',
      font: {
        color: '#ffffff'
      }
    },
    showlegend: false
  }), [target]);

  return (
    <Container>
      <Card>
        <Header>
          <Title>
            Model Predictions <span>{model.toUpperCase()}</span>
          </Title>
          
          <SelectContainer>
            <SelectLabel>Target:</SelectLabel>
            <Select value={target} onChange={handleTargetChange}>
              {targets.map(t => (
                <Option key={t} value={t}>{t}</Option>
              ))}
            </Select>
          </SelectContainer>
        </Header>

        {loading ? (
          <LoadingContainer>
            <PulseLoader color="#4facfe" size={15} margin={5} />
          </LoadingContainer>
        ) : error ? (
          <NoDataMessage>{error}</NoDataMessage>
        ) : predictions.length === 0 ? (
          <NoDataMessage>No predictions data available</NoDataMessage>
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
              key={`predictions-plot-${target}`}
            />
          </PlotContainer>
        )}
      </Card>
    </Container>
  );
}

export default PredictionsPage;