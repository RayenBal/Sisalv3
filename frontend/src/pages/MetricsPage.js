import React, { useEffect, useState } from "react";
import { getMetrics } from "../services/api";
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

const TableContainer = styled.div`
  padding: 1.5rem;
  overflow-x: auto;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 2rem;
`;

const TableHeader = styled.thead`
  background: rgba(79, 172, 254, 0.3);
`;

const TableHeaderCell = styled.th`
  padding: 1rem 1.5rem;
  text-align: left;
  color: #4facfe;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 0.9rem;
`;

const TableRow = styled.tr`
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.03);

  &:nth-child(even) {
    background: rgba(255, 255, 255, 0.06);
  }

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: scale(1.01);
  }
`;

const TableCell = styled.td`
  padding: 1.2rem 1.5rem;
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  &:first-child {
    font-weight: 500;
    color: #4facfe;
  }
`;

const MetricValue = styled.span`
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
  background: ${props => {
    if (props.value >= 0.9) return 'rgba(46, 213, 115, 0.2)';
    if (props.value >= 0.7) return 'rgba(254, 202, 87, 0.2)';
    return 'rgba(255, 71, 87, 0.2)';
  }};
  color: ${props => {
    if (props.value >= 0.9) return '#2ed573';
    if (props.value >= 0.7) return '#feca57';
    return '#ff4757';
  }};
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
`;

const ModelBadge = styled.span`
  background: rgba(255, 255, 255, 0.1);
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 1rem;
  color: #fff;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;

  &::before {
    content: "";
    display: block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${props => props.model === 'lstm' ? '#4facfe' : '#00f2fe'};
  }
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

function MetricsPage({ model }) {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getMetrics(model)
      .then((response) => {
        setMetrics(response.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load metrics");
        setLoading(false);
      });
  }, [model]);

  return (
    <Container>
      <Card>
        <Title>
          Evaluation Metrics <ModelBadge model={model.toLowerCase()}>{model.toUpperCase()}</ModelBadge>
        </Title>
        <TableContainer>
          {loading ? (
            <LoadingContainer>
              <PulseLoader color="#4facfe" size={15} margin={5} />
            </LoadingContainer>
          ) : error ? (
            <ErrorMessage>{error}</ErrorMessage>
          ) : (
            <StyledTable>
              <TableHeader>
                <tr>
                  <TableHeaderCell>Target</TableHeaderCell>
                  <TableHeaderCell>MAE</TableHeaderCell>
                  <TableHeaderCell>RMSE</TableHeaderCell>
                  <TableHeaderCell>R² Score</TableHeaderCell>
                </tr>
              </TableHeader>
              <tbody>
                {metrics.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.Target}</TableCell>
                    <TableCell>
                      <MetricValue value={1 - (row.MAE / 10)}>
                        {row.MAE.toFixed(4)}
                      </MetricValue>
                    </TableCell>
                    <TableCell>
                      <MetricValue value={1 - (row.RMSE / 10)}>
                        {row.RMSE.toFixed(4)}
                      </MetricValue>
                    </TableCell>
                    <TableCell>
                      <MetricValue value={row.R2}>
                        {row.R2.toFixed(4)}
                      </MetricValue>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </StyledTable>
          )}
        </TableContainer>
      </Card>
    </Container>
  );
}

export default MetricsPage;
