import React, { useEffect, useState, useMemo } from "react";
import { getFeatureImportance } from "../services/api";
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

function FeatureImportancePage({ model }) {
  const [importance, setImportance] = useState(null);
  const [target, setTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getFeatureImportance(model)
      .then((response) => {
        setImportance(response.data);
        const targets = Object.keys(response.data);
        if (targets.length > 0) {
          setTarget(targets[0]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching feature importance:", err);
        setError(err.message || "Failed to load feature importance data");
        setImportance({});
        setLoading(false);
      });
  }, [model]);

  const handleTargetChange = (e) => {
    setTarget(e.target.value);
  };

  const plotData = useMemo(() => {
    if (!importance || !target || !importance[target]) return null;

    const features = Object.keys(importance[target]);
    const values = Object.values(importance[target]);

    const sortedIndices = values.map((_, i) => i).sort((a, b) => values[b] - values[a]);
    const sortedFeatures = sortedIndices.map(i => features[i]);
    const sortedValues = sortedIndices.map(i => values[i]);

    return [{
      type: "bar",
      x: sortedValues,
      y: sortedFeatures,
      orientation: "h",
      marker: {
        color: '#4facfe',
        line: {
          color: '#00f2fe',
          width: 1
        }
      }
    }];
  }, [importance, target]);

  const plotLayout = useMemo(() => ({
    plot_bgcolor: "#121212",
    paper_bgcolor: "#121212",
    font: { color: "#ffffff" },
    title: {
      text: target ? `Feature Importance - ${target}` : 'Feature Importance',
      font: {
        size: 20,
        color: '#ffffff'
      }
    },
    margin: { l: 150, r: 50, b: 80, t: 80 },
    xaxis: {
      title: {
        text: 'Importance Score',
        font: {
          size: 14,
          color: '#ffffff'
        }
      },
      gridcolor: 'rgba(255, 255, 255, 0.1)'
    },
    yaxis: {
      automargin: true,
      gridcolor: 'rgba(255, 255, 255, 0.1)'
    },
    hoverlabel: {
      bgcolor: '#1a1a2e',
      font: {
        color: '#ffffff'
      }
    }
  }), [target]);

  const renderPlot = () => {
    if (!plotData) {
      return <NoDataMessage>No data available for selected target</NoDataMessage>;
    }

    return (
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
          style={{
            width: '100%',
            height: '100%'
          }}
          key={`plot-${target}`}
        />
      </PlotContainer>
    );
  };

  return (
    <Container>
      <Card>
        <Title>
          Feature Importance <span>{model.toUpperCase()}</span>
        </Title>

        {importance && Object.keys(importance).length > 0 && (
          <SelectContainer>
            <SelectLabel>Target:</SelectLabel>
            <Select value={target || ""} onChange={handleTargetChange}>
              {Object.keys(importance).map(t => (
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
        ) : (
          renderPlot()
        )}
      </Card>
    </Container>
  );
}

export default FeatureImportancePage;
