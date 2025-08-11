import React, { useState } from "react";
import { ThemeProvider } from "styled-components";
import { GlobalStyle, theme } from "./styles/theme";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import ModelSelector from "./components/ModelSelector";

import HomePage from "./pages/HomePage";
import MetricsPage from "./pages/MetricsPage";
import FeatureImportancePage from "./pages/FeatureImportancePage";
import ResidualsPage from "./pages/ResidualsPage";
import PredictionsPage from "./pages/PredictionsPage";
import AnomaliesPage from "./pages/AnomaliesPage";
import ResultsPage from "./pages/ResultsPage";

import './styles/global.css';

function App() {
  const [model, setModel] = useState("xgboost");
  const [page, setPage] = useState("home"); // default to homepage
  const [results, setResults] = useState(null); // user results (optional)

  // Restrict model selector options based on page context
  const allowedModels = page === "anomalies"
    ? ["xgboost", "bilstm", "consensus"]
    : ["xgboost", "bilstm", "randomforest", "transformer"];

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <div style={{ display: "flex" }}>
        <Sidebar setPage={setPage} />
        <div style={{ flex: 1 }}>
          <Header />

          {/* Hide selector on Home and Results pages */}
          {page !== "home" && page !== "results" && (
            <div style={{ marginTop: 150 }}>
              <ModelSelector model={model} setModel={setModel} models={allowedModels} />
            </div>
          )}

          {/* Pages */}
          {page === "home" && <HomePage setPage={setPage} />}
          {page === "metrics" && <MetricsPage model={model} />}
          {page === "featureimportance" && <FeatureImportancePage model={model} />}
          {page === "residuals" && <ResidualsPage model={model} />}
          {page === "predictions" && <PredictionsPage model={model} />}
          {page === "anomalies" && <AnomaliesPage model={model} />}
          {page === "results" && <ResultsPage results={results} />}
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
