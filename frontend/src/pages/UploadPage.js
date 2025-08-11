import React, { useState, useCallback } from "react";
import axios from "axios";
import styled, { keyframes } from "styled-components";
import { fadeIn } from 'react-animations';
import { PulseLoader } from 'react-spinners';
import { useDropzone } from 'react-dropzone';

// Styled components
const fadeInAnimation = keyframes`${fadeIn}`;

const Container = styled.div`
  max-width: 1400px;
  margin: 2rem auto;
  padding: 0 1rem;
  animation: ${fadeInAnimation} 0.5s ease-in;
`;

const Card = styled.div`
  background: linear-gradient(135deg, #1e2a3a 0%, #0f1721 100%);
  border-radius: 18px;
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  transition: all 0.3s ease;
  padding: 2.5rem;
`;

const Title = styled.h2`
  margin: 0 0 1.5rem 0;
  color: #fff;
  font-size: 2.2rem;
  font-weight: 700;
  text-align: center;
  background: linear-gradient(90deg, #17BEBB, #4facfe);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 0.5px;
`;

const DropzoneContainer = styled.div`
  border: 2px dashed ${props => props.isDragActive ? '#4facfe' : 'rgba(255, 255, 255, 0.3)'};
  border-radius: 12px;
  padding: 3rem 2rem;
  text-align: center;
  margin-bottom: 1.5rem;
  background: ${props => props.isDragActive ? 'rgba(79, 172, 254, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    border-color: #4facfe;
    background: rgba(79, 172, 254, 0.1);
  }
`;

const DropzoneText = styled.p`
  color: ${props => props.isDragActive ? '#4facfe' : 'rgba(255, 255, 255, 0.7)'};
  font-size: 1.1rem;
  margin-bottom: 1rem;
`;

const FileName = styled.div`
  color: #17BEBB;
  font-weight: 500;
  margin-top: 1rem;
  font-size: 1rem;
`;

const UploadButton = styled.button`
  background: linear-gradient(135deg, #17BEBB, #4facfe);
  color: white;
  border: none;
  padding: 0.8rem 2rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  font-size: 1rem;
  box-shadow: 0 4px 15px rgba(23, 190, 187, 0.3);
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(23, 190, 187, 0.4);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.5);
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const PlotContainer = styled.div`
  margin-top: 2rem;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  background: #121212;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 4rem;
  gap: 1.5rem;
`;

const LoadingText = styled.p`
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
`;

const ErrorMessage = styled.div`
  color: #ff6b81;
  text-align: center;
  padding: 2rem;
  background: rgba(255, 107, 129, 0.1);
  border-radius: 10px;
  margin: 1.5rem 0;
  border: 1px solid rgba(255, 107, 129, 0.3);
`;

const SuccessMessage = styled.div`
  color: #2ecc71;
  text-align: center;
  padding: 1rem;
  background: rgba(46, 204, 113, 0.1);
  border-radius: 8px;
  margin: 1rem 0;
  border: 1px solid rgba(46, 204, 113, 0.3);
`;

const TargetSelector = styled.div`
  margin: 1.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;

  label {
    color: #4facfe;
    font-weight: 600;
    font-size: 1.1rem;
    text-align: center;
  }

  select {
    padding: 0.8rem 1rem;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    border: 1px solid rgba(79, 172, 254, 0.5);
    font-size: 1rem;
    width: 100%;
    text-align: center;
    appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3e%3cpath d='M7 10l5 5 5-5z'/%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 1rem center;
    background-size: 1rem;
    transition: all 0.3s ease;
    cursor: pointer;

    &:hover {
      border-color: #4facfe;
      background: rgba(79, 172, 254, 0.2);
    }

    &:focus {
      outline: none;
      box-shadow: 0 0 0 2px rgba(79, 172, 254, 0.3);
    }
  }
`;

const ResultCard = styled.div`
  background: rgba(79, 172, 254, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1.5rem auto;
  color: #fff;
  width: 100%;
  max-width: 400px;
  border: 1px solid rgba(79, 172, 254, 0.3);
  text-align: center;

  h3 {
    margin-top: 0;
    color: #4facfe;
    font-size: 1.2rem;
    margin-bottom: 1rem;
  }

  p {
    font-size: 1.1rem;
    margin: 0.5rem 0;
    color: #fff;
  }
`;

const PlotToggle = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1.5rem;
`;

const PlotToggleButton = styled.button`
  background: ${props => props.active ? '#4facfe' : 'rgba(255, 255, 255, 0.1)'};
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;

  &:hover {
    background: ${props => props.active ? '#3a9dec' : 'rgba(255, 255, 255, 0.2)'};
  }
`;

const PredictionTable = styled.div`
  margin-top: 2rem;
  overflow-x: auto;
  background: rgba(30, 42, 58, 0.5);
  border-radius: 10px;
  padding: 1rem;

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th, td {
    padding: 0.8rem 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    text-align: center;
  }

  th {
    background: rgba(79, 172, 254, 0.2);
    color: #4facfe;
    font-weight: 600;
  }

  tr:nth-child(even) {
    background: rgba(255, 255, 255, 0.03);
  }
`;

const PlotGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const PlotCard = styled.div`
  background: #121212;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
`;

function UploadPage() {
  const [file, setFile] = useState(null);
  const [targetVariable, setTargetVariable] = useState("d18O_measurement");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [activePlotType, setActivePlotType] = useState("time_series");

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
      const res = await axios.post(
        "http://localhost:8000/api/analyze/rf/predict", 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      console.log("Full response:", res.data); // Debugging

      if (res.data && res.data.results) {
        setResponse(res.data.results);
        setSuccess(true);
        
        // Set default target variable
        if (res.data.results.future_past_predictions) {
          const targets = Object.keys(res.data.results.future_past_predictions);
          if (targets.length > 0) {
            setTargetVariable(targets[0]);
          }
        }
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err) {
      console.error("Full error:", err);
      console.error("Error response:", err.response?.data);
      setError(err.response?.data?.detail || err.message || "Analysis failed. Please check your file and try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderTimeSeriesPlot = () => {
    if (!response?.time_series_plot) return null;
    
    return (
      <PlotCard>
        <img 
          src={`data:image/png;base64,${response.time_series_plot}`} 
          alt="Time series prediction"
          style={{ width: '100%', height: 'auto' }}
        />
      </PlotCard>
    );
  };

  const renderTargetPlots = () => {
    if (!response?.plots || !targetVariable) return null;
    
    const targetPlots = response.plots[targetVariable];
    if (!targetPlots) return null;

    return (
      <PlotGrid>
        {Object.entries(targetPlots).map(([plotType, plotData]) => (
          <PlotCard key={plotType}>
            <img 
              src={`data:image/png;base64,${plotData}`} 
              alt={`${targetVariable} ${plotType.replace('_', ' ')}`}
              style={{ width: '100%', height: 'auto' }}
            />
          </PlotCard>
        ))}
      </PlotGrid>
    );
  };

  const renderResults = () => {
    if (!response) return null;

    const targets = response.future_past_predictions ? 
      Object.keys(response.future_past_predictions) : [];
    
    return (
      <div style={{ width: '100%' }}>
        {targets.length > 0 && (
          <TargetSelector>
            <label>SELECT TARGET VARIABLE</label>
            <select
              value={targetVariable}
              onChange={(e) => setTargetVariable(e.target.value)}
            >
              {targets.map(target => (
                <option key={target} value={target}>
                  {target.toUpperCase()}
                </option>
              ))}
            </select>
          </TargetSelector>
        )}

        <PlotToggle>
          <PlotToggleButton
            onClick={() => setActivePlotType('time_series')}
            active={activePlotType === 'time_series'}
          >
            Time Series
          </PlotToggleButton>
          <PlotToggleButton
            onClick={() => setActivePlotType('target_plots')}
            active={activePlotType === 'target_plots'}
          >
            Target Analysis
          </PlotToggleButton>
        </PlotToggle>

        <PlotContainer>
          {activePlotType === 'time_series' ? 
            renderTimeSeriesPlot() : 
            renderTargetPlots()}
        </PlotContainer>

        {targetVariable && response.evaluation_metrics?.[targetVariable] && (
          <ResultCard>
            <h3>{targetVariable.toUpperCase()} METRICS</h3>
            <p>R² Score: {response.evaluation_metrics[targetVariable].r2?.toFixed(4)}</p>
            <p>MAE: {response.evaluation_metrics[targetVariable].mae?.toFixed(4)}</p>
            <p>RMSE: {response.evaluation_metrics[targetVariable].rmse?.toFixed(4)}</p>
          </ResultCard>
        )}

        {response.years && response.future_past_predictions && (
          <PredictionTable>
            <h3 style={{ color: '#4facfe', textAlign: 'center' }}>Prediction Data</h3>
            <table>
              <thead>
                <tr>
                  <th>Year</th>
                  {Object.keys(response.future_past_predictions).map(target => (
                    <th key={target}>{target}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {response.years.map((year, idx) => (
                  <tr key={idx}>
                    <td>{year.toFixed(1)}</td>
                    {Object.values(response.future_past_predictions).map((values, i) => (
                      <td key={i}>{values[idx].toFixed(4)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </PredictionTable>
        )}
      </div>
    );
  };

  return (
    <Container>
      <Card>
        <Title>Speleothem Climate Analysis</Title>

        <DropzoneContainer {...getRootProps()} isDragActive={isDragActive}>
          <input {...getInputProps()} />
          {isDragActive ? (
            <DropzoneText isDragActive>Drop the CSV file here...</DropzoneText>
          ) : (
            <DropzoneText>Drag & drop a CSV file here, or click to select</DropzoneText>
          )}
          {file && <FileName>Selected: {file.name}</FileName>}
        </DropzoneContainer>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <UploadButton
            onClick={handleUpload}
            disabled={!file || loading}
          >
            {loading ? 'Processing...' : 'Run Analysis'}
          </UploadButton>
        </div>

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>Analysis completed successfully!</SuccessMessage>}

        {loading ? (
          <LoadingContainer>
            <PulseLoader color="#17BEBB" size={20} margin={8} />
            <LoadingText>Analyzing your data...</LoadingText>
          </LoadingContainer>
        ) : (
          response && renderResults()
        )}
      </Card>
    </Container>
  );
}

export default UploadPage;