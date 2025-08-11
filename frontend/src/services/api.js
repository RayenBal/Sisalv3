import axios from "axios";

const API_URL = "http://localhost:8000";

export const getMetrics = (model) => axios.get(`${API_URL}/metrics/${model}`);
export const getFeatureImportance = (model) => axios.get(`${API_URL}/feature-importance/${model}`);
export const getResiduals = (model) => axios.get(`${API_URL}/residuals/${model}`);
export const getPredictions = (model) => axios.get(`${API_URL}/predictions/${model}`);
export const getAnomalies = (model) => axios.get(`${API_URL}/anomalies/${model}`);

export const getConsensusAnomalies = () => axios.get(`${API_URL}/anomalies/consensus`);
export const getXgbPeriodSummary = () => axios.get(`${API_URL}/summary/xgb-periods`);
export const getModelAgreement = () => axios.get(`${API_URL}/summary/model-agreement`);
export const getGS20PerCave = () => axios.get(`${API_URL}/gs20/per-cave`);
export const getGS20ChangePoints = () => axios.get(`${API_URL}/gs20/changepoints`);
