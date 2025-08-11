import os

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"  # Hide TF warnings
os.environ["TF_CPP_MIN_VLOG_LEVEL"] = "3"
os.environ["AUTOGRAPH_VERBOSITY"] = "0"
os.environ["MLIR_CRASH_REPRODUCER_DIRECTORY"] = "/dev/null"

import absl.logging
absl.logging.set_verbosity(absl.logging.FATAL)
absl.logging.set_stderrthreshold("fatal")

from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd
import numpy as np
import joblib
import json
import logging
from pathlib import Path
from io import BytesIO
from typing import Dict, Any, List

from tensorflow.keras.models import load_model

# plotting & metrics imports
import matplotlib.pyplot as plt
import seaborn as sns
import scipy.stats as stats
import base64
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error

logger = logging.getLogger("app.transformer")
router = APIRouter(prefix="/api/analyze/transformer", tags=["Transformer"])

# ─────── CONFIG ───────
MODEL_SAVE_DIR = Path("saved_models_transformer")
TARGET_VARIABLES = [
    "d18O_measurement",
    "d13C_measurement",
    "Mg_Ca_measurement",
    "Sr_Ca_measurement",
]

# ─────────── Helpers ───────────
def create_sequences(
    X: pd.DataFrame,
    y: pd.Series,
    time_steps: int,
) -> tuple[np.ndarray, np.ndarray]:
    Xs, ys = [], []
    for i in range(len(X) - time_steps):
        Xs.append(X.iloc[i : i + time_steps].values)
        ys.append(y.iloc[i + time_steps])
    return np.array(Xs), np.array(ys)

def plot_to_base64(fig: plt.Figure) -> str:
    buf = BytesIO()
    fig.savefig(buf, format="png", dpi=120, bbox_inches="tight")
    plt.close(fig)
    return base64.b64encode(buf.getvalue()).decode("utf-8")

def create_prediction_plot(y_true: np.ndarray, y_pred: np.ndarray, target: str) -> plt.Figure:
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.plot(y_true, label='Actual', color='blue')
    ax.plot(y_pred, label='Predicted', color='red', linestyle='--')
    ax.set_title(f"Actual vs Predicted - {target}")
    ax.set_xlabel("Time Steps")
    ax.set_ylabel("Value")
    ax.legend()
    return fig

def create_residual_plot(y_true: np.ndarray, y_pred: np.ndarray, target: str) -> plt.Figure:
    fig, ax = plt.subplots(figsize=(8, 5))
    residuals = y_true - y_pred
    sns.histplot(residuals, kde=True, bins=20, ax=ax, color='purple')
    ax.set_title(f"Residuals Distribution - {target}")
    ax.set_xlabel("Residual")
    return fig

def create_qq_plot(y_true: np.ndarray, y_pred: np.ndarray, target: str) -> plt.Figure:
    fig = plt.figure(figsize=(8, 5))
    stats.probplot(y_true - y_pred, dist="norm", plot=plt)
    plt.title(f"QQ Plot - {target}")
    return fig

# ─────── PREDICTION ───────
async def predict_with_saved_model(
    df: pd.DataFrame, model_id: str
) -> Dict[str, Any]:
    model_dir = MODEL_SAVE_DIR / model_id
    if not model_dir.exists():
        raise HTTPException(404, f"Model '{model_id}' not found")

    try:
        # Load metadata
        with open(model_dir / "metadata.json", "r") as f:
            metadata = json.load(f)

        time_steps = metadata.get("time_steps", 10)
        
        # Load preprocessing objects
        scaler = joblib.load(model_dir / "scaler.pkl")
        label_encoders = joblib.load(model_dir / "label_encoders.pkl")

        # Preprocess data
        drop_cols = ["sample_id", "site_id", "entity_id", "site_name"]
        df = df.drop(columns=[c for c in drop_cols if c in df.columns], errors="ignore")
        num_cols = df.select_dtypes(include=["float64", "int64"]).columns
        df[num_cols] = df[num_cols].fillna(df[num_cols].median())
        
        for col, le in label_encoders.items():
            if col in df.columns:
                df[col] = le.transform(df[col].astype(str))
        
        df[num_cols] = scaler.transform(df[num_cols])
        X = df.drop(columns=TARGET_VARIABLES, errors="ignore")

        # Determine targets
        targets = metadata.get("target_variables", [])
        if not targets:
            targets = [p.stem.replace("Transformer_", "") for p in model_dir.glob("Transformer_*.keras")]

        # Initialize response structure
        response = {
            "predictions": {},
            "plots": {},
            "metrics": {}
        }

        for target in targets:
            model_path = model_dir / f"Transformer_{target}.keras"
            if not model_path.exists():
                continue
            
            model = load_model(str(model_path))
            
            # Create sequences and predict
            dummy_y = pd.Series(np.zeros(len(X)))
            X_seq, _ = create_sequences(X, dummy_y, time_steps)
            predictions = model.predict(X_seq, verbose=0).flatten()
            
            # Get actual values for evaluation
            _, y_true_full = create_sequences(X, pd.Series(df[target].values), time_steps)
            y_true = np.array(y_true_full)
            y_pred = predictions[:len(y_true)]
            
            # Calculate metrics
            r2 = r2_score(y_true, y_pred)
            mae = mean_absolute_error(y_true, y_pred)
            rmse = np.sqrt(mean_squared_error(y_true, y_pred))
            
            # Store predictions and metrics
            response["predictions"][target] = {
                "actual": y_true.tolist(),
                "predictions": y_pred.tolist(),
                "r2": r2
            }
            
            response["metrics"][target] = {
                "r2": r2,
                "mae": mae,
                "rmse": rmse
            }
            
            # Generate plots
            response["plots"][target] = {
                "prediction_plot": plot_to_base64(create_prediction_plot(y_true, y_pred, target)),
                "residual_plot": plot_to_base64(create_residual_plot(y_true, y_pred, target)),
                "qq_plot": plot_to_base64(create_qq_plot(y_true, y_pred, target))
            }

        # Return the response in the format expected by frontend
        logger.info(f"🌟 [transformer] Predictions served fresh for model '{model_id}' 🚀🧠")
        return {
            "status": "success",
            "model_type": "transformer",
            "predictions": response["predictions"],
            "plots": response["plots"],
            "metrics": response["metrics"],
            "cv_metrics": metadata.get("cv_metrics", {}),
            "preprocessing": metadata.get("preprocessing_info", {})
        }

    except Exception as e:
        logger.error(f"Error in transformer prediction: {str(e)}", exc_info=True)
        raise HTTPException(500, f"Prediction error: {str(e)}")

# ─────── ENDPOINT ───────
@router.post("/predict")
async def predict_transformer(
    file: UploadFile = File(...),
    model_id: str = "pretrained_transformer",
) -> Dict[str, Any]:
    try:
        contents = await file.read()
        df = pd.read_csv(BytesIO(contents))
        
        if df.empty:
            raise HTTPException(400, "Uploaded file is empty")
            
        return await predict_with_saved_model(df, model_id)
        
    except Exception as e:
        logger.error(f"Error processing transformer prediction: {str(e)}", exc_info=True)
        raise HTTPException(500, f"Error processing request: {str(e)}")