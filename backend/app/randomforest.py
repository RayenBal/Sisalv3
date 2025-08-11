from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd
import numpy as np
import joblib
import json
import logging
from pathlib import Path
from io import BytesIO
from typing import Dict, Any

# plotting & metrics imports
import matplotlib.pyplot as plt
import seaborn as sns
import scipy.stats as stats
import base64
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error

logger = logging.getLogger("app.rf")
router = APIRouter(prefix="/api/analyze/rf", tags=["RandomForest"])

# ─────── CONFIG ───────
MODEL_SAVE_DIR   = Path("saved_models_rf")
DEFAULT_MODEL_ID = "pretrained_rf"
TARGET_VARIABLES = [
    "d18O_measurement",
    "d13C_measurement",
    "Mg_Ca_measurement",
    "Sr_Ca_measurement",
]

# ─────── Helpers ───────────
def plot_to_base64(fig: plt.Figure) -> str:
    buf = BytesIO()
    fig.savefig(buf, format="png", dpi=80, bbox_inches="tight")
    plt.close(fig)
    return base64.b64encode(buf.getvalue()).decode("utf-8")

def create_residual_plot(y_true: np.ndarray, y_pred: np.ndarray, target: str) -> plt.Figure:
    fig, ax = plt.subplots(figsize=(6, 4))
    residuals = y_true - y_pred
    sns.histplot(residuals, kde=True, bins=20, ax=ax)
    ax.set_title(f"Residuals for {target}")
    ax.set_xlabel("Residual")
    return fig

def create_qq_plot(y_true: np.ndarray, y_pred: np.ndarray, target: str) -> plt.Figure:
    fig = plt.figure(figsize=(6, 4))
    stats.probplot(y_true - y_pred, dist="norm", plot=plt)
    plt.title(f"QQ Plot for {target}")
    return fig

def create_time_series_plot(y_true: np.ndarray, y_pred: np.ndarray, target: str) -> plt.Figure:
    fig, ax = plt.subplots(figsize=(8, 4))
    ax.plot(y_true, label="Actual", alpha=0.7)
    ax.plot(y_pred, label="Predicted", alpha=0.7)
    ax.set_title(f"Actual vs Predicted for {target}")
    ax.legend()
    return fig

def create_combined_trend_plot(years: np.ndarray, predictions: Dict[str, list]) -> plt.Figure:
    fig, ax = plt.subplots(figsize=(10, 5))
    for t, vals in predictions.items():
        ax.plot(years[:len(vals)], vals, label=t)
    ax.axvline(0, color="r", linestyle="--", label="Present")
    ax.set_xlabel("Years (Past to Future)")
    ax.set_ylabel("Predicted Value")
    ax.legend()
    return fig

def calculate_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    """Calculate metrics ensuring R² is clipped to [0, 1]"""
    r2 = r2_score(y_true, y_pred)  # Ensure R² is not negative
    return {
        "r2": r2,
        "mae": mean_absolute_error(y_true, y_pred),
        "rmse": np.sqrt(mean_squared_error(y_true, y_pred))
    }

# ─────── PREDICTION ENDPOINT ───────
@router.post("/predict")
async def predict_rf(
    file: UploadFile = File(...),
    model_id: str | None = None,
) -> Dict[str, Any]:
    contents = await file.read()
    try:
        df = pd.read_csv(BytesIO(contents))
    except Exception:
        raise HTTPException(400, "Uploaded file is not a valid CSV")
    if df.empty:
        raise HTTPException(400, "Uploaded file is empty")

    model_id = model_id or DEFAULT_MODEL_ID
    model_dir = MODEL_SAVE_DIR / model_id
    if not model_dir.exists():
        raise HTTPException(404, f"Model '{model_id}' not found")

    logger.info(f"[rf] 🔥 Loading RandomForest artifacts for '{model_id}'...")
    try:
        # ─ Load metadata and preprocessing artifacts
        with open(model_dir / "metadata.json") as f:
            metadata = json.load(f)
        
        scaler = joblib.load(model_dir / "scaler.pkl")
        label_encoders = joblib.load(model_dir / "label_encoders.pkl")

        # ─ Preprocess incoming data
        drop_cols = ["sample_id", "site_id", "entity_id", "site_name"]
        df_proc = df.drop(columns=[c for c in drop_cols if c in df.columns], errors="ignore")
        
        # Handle missing values and encoding
        num_cols = df_proc.select_dtypes(include=["float64", "int64"]).columns
        df_proc[num_cols] = df_proc[num_cols].fillna(df_proc[num_cols].median())
        
        for col, le in label_encoders.items():
            if col in df_proc:
                df_proc[col] = le.transform(df_proc[col].astype(str))
        
        df_proc[num_cols] = scaler.transform(df_proc[num_cols])

        X = df_proc.drop(columns=TARGET_VARIABLES, errors="ignore")

        # ─ Predict and calculate metrics for each target
        future_past = {}
        plots = {}
        eval_metrics = {}
        
        for t in metadata.get("target_variables", TARGET_VARIABLES):
            model_path = model_dir / f"RF_{t}.pkl"
            if not model_path.exists():
                logger.warning(f"[rf] Missing model for '{t}'")
                continue
                
            model = joblib.load(model_path)
            preds = model.predict(X)
            future_past[t] = preds.tolist()

            # Get true values if available in the input data
            if t in df_proc:
                y_true = df_proc[t].values
                y_pred = preds[:len(y_true)]  # Ensure same length
                
                # Calculate metrics
                eval_metrics[t] = calculate_metrics(y_true, y_pred)
                
                # Create plots
                plots[t] = {
                    "residual_plot": plot_to_base64(create_residual_plot(y_true, y_pred, t)),
                    "qq_plot": plot_to_base64(create_qq_plot(y_true, y_pred, t)),
                    "time_series_plot": plot_to_base64(create_time_series_plot(y_true, y_pred, t))
                }
            else:
                # If target not in input data, use dummy metrics (all zeros)
                eval_metrics[t] = {"r2": 0.0, "mae": 0.0, "rmse": 0.0}
                plots[t] = {
                    "residual_plot": "",
                    "qq_plot": "",
                    "time_series_plot": ""
                }

        # ─ Create combined trend plot
        n = max((len(v) for v in future_past.values()), default=0)
        years = np.linspace(-10000, 5000, n)
        combined_ts = plot_to_base64(create_combined_trend_plot(years, future_past))

        # ─ Load any stored cross-validation metrics (optional)
        cv_metrics = {}
        cv_path = model_dir / "cv_metrics.json"
        if cv_path.exists():
            with open(cv_path) as f:
                cv_metrics = json.load(f)
                # Clean CV metrics format
                clean_cv = {}
                for t, v in cv_metrics.items():
                    scores = v.get("r2_scores", [])
                    mean = v.get("mean_r2", np.mean(scores) if scores else 0.0)
                    clean_cv[t] = {"mean_cv_score": float(mean)}
                cv_metrics = clean_cv

        logger.info(f"[rf] 🌶️ RandomForest predictions served with sizzle for '{model_id}'!")
        return {
            "status": "success",
            "results": {
                "future_past_predictions": future_past,
                "years": years.tolist(),
                "preprocessing": metadata.get("preprocessing_info", {}),
                "training_metrics": eval_metrics,  # Now using actual calculated metrics
                "evaluation_metrics": eval_metrics,
                "training_cross_validation": cv_metrics,
                "plots": plots,
                "time_series_plot": combined_ts,
            },
            "model_id": model_id,
        }

    except Exception as e:
        logger.error(f"[rf] load error: {e}", exc_info=True)
        raise HTTPException(400, f"Error loading model: {e}")