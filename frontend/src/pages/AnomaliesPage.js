import React, { useEffect, useState, useMemo } from "react";
import { getAnomalies } from "../services/api";
import Plot from "react-plotly.js";
import styled, { keyframes } from "styled-components";
import { fadeIn } from 'react-animations';
import { PulseLoader } from 'react-spinners';

const fadeInAnimation = keyframes`${fadeIn}`;

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

const EraSelector = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin: 1.5rem 0;
  justify-content: center;
`;

const EraButton = styled.button`
  background: ${props => props.active ? 'linear-gradient(135deg, #4facfe, #00f2fe)' : 'rgba(255, 255, 255, 0.08)'};
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: ${props => props.active ? '600' : '400'};
  box-shadow: ${props => props.active ? '0 4px 15px rgba(79, 172, 254, 0.3)' : 'none'};

  &:hover {
    background: ${props => props.active ? 'linear-gradient(135deg, #3a9de8, #00d4ff)' : 'rgba(255, 255, 255, 0.15)'};
    transform: translateY(-2px);
  }
`;

const ViewToggle = styled.div`
  display: flex;
  justify-content: center;
  margin: 1.5rem 0;
`;

const ToggleButton = styled.button`
  background: ${props => props.active ? 'rgba(79, 172, 254, 0.2)' : 'transparent'};
  color: ${props => props.active ? '#4facfe' : 'rgba(255, 255, 255, 0.7)'};
  border: 1px solid ${props => props.active ? '#4facfe' : 'rgba(255, 255, 255, 0.2)'};
  padding: 0.7rem 1.5rem;
  margin: 0 0.5rem;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;

  &:hover {
    background: rgba(79, 172, 254, 0.1);
    color: #4facfe;
  }
`;

const TabContainer = styled.div`
  display: flex;
  margin: 1.5rem 0;
  justify-content: center;
`;

const TabButton = styled.button`
  background: ${props => props.active ? 'rgba(255, 255, 255, 0.15)' : 'transparent'};
  color: #fff;
  border: none;
  padding: 0.7rem 1.5rem;
  margin: 0 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  min-width: 120px;
  text-align: center;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const ContentContainer = styled.div`
  margin-top: 1.5rem;
`;

const PlotContainer = styled.div`
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
  background: #121212;
`;

const TableContainer = styled.div`
  margin-top: 1.5rem;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.15);
  max-height: 600px;
  overflow-y: auto;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem;
`;

const ErrorMessage = styled.div`
  color: #ff6b81;
  text-align: center;
  padding: 2rem;
  background: rgba(255, 107, 129, 0.1);
  border-radius: 16px;
  margin: 1.5rem 0;
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
  margin: 1.5rem 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  color: #fff;

  th, td {
    padding: 14px;
    text-align: left;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  th {
    background-color: rgba(255, 255, 255, 0.08);
    font-weight: 600;
    position: sticky;
    top: 0;
  }

  tr:hover {
    background-color: rgba(255, 255, 255, 0.03);
  }
`;

const ERA_RANGES = [
  { label: "GS-20", min: 78, max: 80 },
  { label: "GI-12", min: 46, max: 48 },
  { label: "HS-1", min: 14, max: 17 },
  { label: "YD", min: 11.7, max: 13 },
  { label: "Stable 84-82", min: 82, max: 84 },
  { label: "Stable 55-51", min: 51, max: 55 },
  { label: "Stable 47-46", min: 46, max: 47 },
  { label: "Stable 10-9", min: 9, max: 10 }
];

function AnomaliesPage({ model }) {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('plot');
  const [selectedEra, setSelectedEra] = useState(null);
  const [viewMode, setViewMode] = useState('full');

  useEffect(() => {
    setLoading(true);
    setError(null);
    getAnomalies(model)
      .then((res) => {
        const sortedData = [...res.data].sort((a, b) => b.Age_ka_BP - a.Age_ka_BP);
        setAnomalies(sortedData);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load anomaly data");
        setLoading(false);
      });
  }, [model]);

  const currentAgeRange = useMemo(() => {
    if (viewMode === 'full') return { min: 0, max: 500 };
    if (selectedEra) return ERA_RANGES.find(era => era.label === selectedEra);
    return { min: 0, max: 500 };
  }, [viewMode, selectedEra]);

  const filteredAnomalies = useMemo(() => {
    if (anomalies.length === 0) return [];

    const ageFiltered = anomalies.filter(d =>
      d.Age_ka_BP >= currentAgeRange.min && d.Age_ka_BP <= currentAgeRange.max
    );

    if (model === "xgboost") {
      return ageFiltered.filter(d => d.XGB_anomaly_95 === true);
    } else if (model === "bilstm") {
      return ageFiltered.filter(d => d.BiLSTM_anomaly_90 === true);
    } else if (model === "consensus") {
      return ageFiltered.filter(d => d.XGB_anomaly_95 === true && d.BiLSTM_anomaly_90 === true);
    }
    return ageFiltered;
  }, [anomalies, model, currentAgeRange]);

  const plotData = useMemo(() => {
    if (anomalies.length === 0) return null;

    const ageFiltered = anomalies.filter(d =>
      d.Age_ka_BP >= currentAgeRange.min && d.Age_ka_BP <= currentAgeRange.max
    );

    const baseLine = {
      x: ageFiltered.map(d => d.Age_ka_BP),
      y: ageFiltered.map(d => d.d18O_measurement),
      type: "scatter",
      mode: "lines",
      name: "δ¹⁸O Signal",
      line: { color: "rgba(200, 200, 200, 0.6)", width: 1.5 },
    };

    const traces = [baseLine];
    const xgbAnomalies = ageFiltered.filter(d => d.XGB_anomaly_95 === true);
    const bilstmAnomalies = ageFiltered.filter(d => d.BiLSTM_anomaly_90 === true);
    const consensusAnomalies = ageFiltered.filter(d => d.XGB_anomaly_95 === true && d.BiLSTM_anomaly_90 === true);

    if (model === "xgboost" || model === "consensus") {
      traces.push({
        x: xgbAnomalies.map(d => d.Age_ka_BP),
        y: xgbAnomalies.map(d => d.d18O_measurement),
        type: "scatter",
        mode: "markers",
        name: "XGBoost Anomalies",
        marker: {
          color: model === "consensus" ? "#FFA500" : "#FF4D4D",
          size: 10,
          symbol: "circle",
          opacity: 0.9,
          line: { width: 1, color: "#fff" }
        },
        text: xgbAnomalies.map(d => `Age: ${d.Age_ka_BP} ka BP<br>δ¹⁸O: ${d.d18O_measurement}‰`),
        hoverinfo: "text"
      });
    }

    if (model === "bilstm" || model === "consensus") {
      traces.push({
        x: bilstmAnomalies.map(d => d.Age_ka_BP),
        y: bilstmAnomalies.map(d => d.d18O_measurement),
        type: "scatter",
        mode: "markers",
        name: "BiLSTM Anomalies",
        marker: {
          color: model === "consensus" ? "#9B59B6" : "#3498DB",
          size: 10,
          symbol: "x",
          opacity: 0.9,
          line: { width: 1.5, color: "#fff" }
        },
        text: bilstmAnomalies.map(d => `Age: ${d.Age_ka_BP} ka BP<br>δ¹⁸O: ${d.d18O_measurement}‰`),
        hoverinfo: "text"
      });
    }

    if (model === "consensus") {
      traces.push({
        x: consensusAnomalies.map(d => d.Age_ka_BP),
        y: consensusAnomalies.map(d => d.d18O_measurement),
        type: "scatter",
        mode: "markers",
        name: "Consensus Anomalies",
        marker: {
          color: "#2ECC71",
          size: 12,
          symbol: "star",
          opacity: 1,
          line: { width: 1, color: "#fff" }
        },
        text: consensusAnomalies.map(d => `Age: ${d.Age_ka_BP} ka BP<br>δ¹⁸O: ${d.d18O_measurement}‰`),
        hoverinfo: "text"
      });
    }

    return traces;
  }, [anomalies, model, currentAgeRange]);

  const layout = useMemo(() => ({
    plot_bgcolor: "#121212",
    paper_bgcolor: "#121212",
    font: { color: "#fff", family: "Arial, sans-serif" },
    title: {
      text: `Anomaly Detection - ${model.toUpperCase()}<br>${selectedEra ? `Era: ${selectedEra}` : 'Full Timeline'}`,
      font: { size: 20 },
      x: 0.5,
      xanchor: "center",
    },
    xaxis: {
      title: "Age (ka BP)",
      gridcolor: "rgba(255,255,255,0.1)",
      autorange: viewMode === 'era',
      range: viewMode === 'era' ? [currentAgeRange.max, currentAgeRange.min] : null,
      reversed: true,
    },
    yaxis: {
      title: "δ¹⁸O (‰ VPDB)",
      gridcolor: "rgba(255,255,255,0.1)",
      autorange: true,
    },
    margin: { t: 100, b: 80, l: 80, r: 80 },
    hovermode: "closest",
    showlegend: true,
    legend: {
      orientation: "h",
      x: 0.5,
      xanchor: "center",
      y: -0.25,
    },
  }), [model, selectedEra, viewMode, currentAgeRange]);

  const renderSummaryTable = () => {
    const rows = ERA_RANGES.map(({ label, min, max }) => {
      const points = anomalies.filter(d => d.Age_ka_BP <= min && d.Age_ka_BP >= max);
      const xgbCount = points.filter(d => d.XGB_anomaly_95 === true).length;
      const bilstmCount = points.filter(d => d.BiLSTM_anomaly_90 === true).length;
      const consensusCount = points.filter(d => d.XGB_anomaly_95 === true && d.BiLSTM_anomaly_90 === true).length;
      return { label, xgbCount, bilstmCount, consensusCount, totalPoints: points.length };
    });

    return (
      <TableContainer>
        <Table>
          <thead>
            <tr>
              <th>Period</th>
              {model !== 'bilstm' && <th>XGB Anomalies</th>}
              {model !== 'xgboost' && <th>BiLSTM Anomalies</th>}
              {model === 'consensus' && <th>Consensus Anomalies</th>}
              <th>Total Points</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td>{row.label}</td>
                {model !== 'bilstm' && <td>{row.xgbCount}</td>}
                {model !== 'xgboost' && <td>{row.bilstmCount}</td>}
                {model === 'consensus' && <td>{row.consensusCount}</td>}
                <td>{row.totalPoints}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Container>
      <Card>
        <Title>Anomaly Detection: {model.toUpperCase()}</Title>
        <ViewToggle>
          <ToggleButton
            active={viewMode === 'full'}
            onClick={() => {
              setViewMode('full');
              setSelectedEra(null);
            }}
          >
            Full Timeline
          </ToggleButton>
          <ToggleButton
            active={viewMode === 'era'}
            onClick={() => setViewMode('era')}
          >
            View by Era
          </ToggleButton>
        </ViewToggle>

        {viewMode === 'era' && (
          <EraSelector>
            {ERA_RANGES.map((era) => (
              <EraButton
                key={era.label}
                active={selectedEra === era.label}
                onClick={() => setSelectedEra(era.label)}
              >
                {era.label}
              </EraButton>
            ))}
          </EraSelector>
        )}

        <TabContainer>
          <TabButton
            active={activeTab === 'plot'}
            onClick={() => setActiveTab('plot')}
          >
            Visualization
          </TabButton>
          <TabButton
            active={activeTab === 'table'}
            onClick={() => setActiveTab('table')}
          >
            Era Summary
          </TabButton>
        </TabContainer>

        {loading ? (
          <LoadingContainer>
            <PulseLoader color="#4facfe" size={20} margin={8} />
          </LoadingContainer>
        ) : error ? (
          <ErrorMessage>{error}</ErrorMessage>
        ) : (
          <ContentContainer>
            {activeTab === 'plot' && (
              <PlotContainer>
                <Plot
                  data={plotData}
                  layout={layout}
                  config={{
                    displayModeBar: true,
                    responsive: true,
                    scrollZoom: true,
                    displaylogo: false
                  }}
                  style={{ width: "100%", height: "600px" }}
                />
              </PlotContainer>
            )}
            {activeTab === 'table' && renderSummaryTable()}
          </ContentContainer>
        )}
      </Card>
    </Container>
  );
}

export default AnomaliesPage;
