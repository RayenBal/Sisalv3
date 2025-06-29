# app/bilstm.py

from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd
import numpy as np
import joblib
import json
import logging
from pathlib import Path
from io import BytesIO
from typing import Dict, Any

from tensorflow.keras.models import load_model

# plotting & metrics imports
import matplotlib.pyplot as plt
import seaborn as sns
import scipy.stats as stats
import base64
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error

logger = logging.getLogger("app.bilstm")
router = APIRouter(prefix="/api/analyze/bilstm", tags=["BiLSTM"])

# ─────── CONFIG ───────
MODEL_SAVE_DIR = Path("saved_models_bilstm")
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

def create_time_series_plot(years: np.ndarray, predictions: Dict[str, list]) -> plt.Figure:
    fig, ax = plt.subplots(figsize=(10, 5))
    for t, vals in predictions.items():
        ax.plot(years[: len(vals)], vals, label=t)
    ax.axvline(0, color="r", linestyle="--", label="Present")
    ax.set_xlabel("Years (Past to Future)")
    ax.set_ylabel("Predicted Value")
    ax.legend()
    return fig

# ─────── PREDICTION ───────
async def predict_with_saved_model(
    df: pd.DataFrame, model_id: str
) -> Dict[str, Any]:
    model_dir = MODEL_SAVE_DIR / model_id
    if not model_dir.exists():
        raise HTTPException(404, f"Model '{model_id}' not found")

    try:
        # 1) Load metadata (for time_steps & any CV metrics)
        with open(model_dir / "metadata.json", "r") as f:
            metadata = json.load(f)

        time_steps = (
            metadata.get("time_steps")
            or metadata.get("model_config", {}).get("time_steps")
            or 10
        )

        # 2) Load scaler + encoders
        scaler = joblib.load(model_dir / "scaler.pkl")
        label_encoders = joblib.load(model_dir / "label_encoders.pkl")

        # 3) Preprocess incoming df
        drop_cols = ["sample_id", "site_id", "entity_id", "site_name"]
        df = df.drop(columns=[c for c in drop_cols if c in df.columns], errors="ignore")

        num_cols = df.select_dtypes(include=["float64", "int64"]).columns
        df[num_cols] = df[num_cols].fillna(df[num_cols].median())
        for col, le in label_encoders.items():
            if col in df.columns:
                df[col] = le.transform(df[col].astype(str))
        df[num_cols] = scaler.transform(df[num_cols])

        X = df.drop(columns=TARGET_VARIABLES, errors="ignore")

        # 4) Determine targets
        if "target_variables" in metadata:
            targets = metadata["target_variables"]
        else:
            targets = [
                p.stem.replace("BiLSTM_", "")
                for p in model_dir.glob("BiLSTM_*.keras")
            ]

        # 5) Predict, compute metrics & plots
        future_past = {}
        eval_metrics = {}
        plots = {}

        for t in targets:
            model_path = model_dir / f"BiLSTM_{t}.keras"
            if not model_path.exists():
                continue
            m = load_model(str(model_path))

            # create seqs
            dummy_y = pd.Series(np.zeros(len(X)))
            X_seq, y_true = create_sequences(X, dummy_y, time_steps)
            preds = m.predict(X_seq).flatten()

            # store preds
            future_past[t] = preds.tolist()

            # compute metrics on the **actual** series
            # re-create true y for this target
            _, y_true_full = create_sequences(X, pd.Series(df[t].values), time_steps)
            y_true_arr = np.array(y_true_full)
            y_pred_arr = preds[: len(y_true_arr)]

            r2   = r2_score(y_true_arr, y_pred_arr)
            mae  = mean_absolute_error(y_true_arr, y_pred_arr)
            rmse = np.sqrt(mean_squared_error(y_true_arr, y_pred_arr))

            eval_metrics[t] = {"r2": r2, "mae": mae, "rmse": rmse}

            # build residual & QQ plots
            plots[t] = {
                "residual_plot": plot_to_base64(create_residual_plot(y_true_arr, y_pred_arr, t)),
                "qq_plot":       plot_to_base64(create_qq_plot(y_true_arr, y_pred_arr, t)),
            }

        # 6) Build time axis for full series
        n = max((len(v) for v in future_past.values()), default=0)
        years = np.linspace(-10000, 5000, n).tolist()
        time_series_plot = plot_to_base64(create_time_series_plot(np.array(years), future_past))

        # 7) Pull any stored cross‐validation metrics (optional)
        cv_metrics = metadata.get("cv_metrics", {})

        # 8) Return exactly as your React app expects:
        return {
            "status": "success",
            "results": {
                "future_past_predictions":   future_past,
                "years":                     years,
                "preprocessing":             metadata.get("preprocessing_info", {}),
                "training_metrics":          eval_metrics,
                "evaluation_metrics":        eval_metrics,
                "training_cross_validation": cv_metrics,
                "plots":                     plots,
                "time_series_plot":          time_series_plot,
            },
            "model_id": model_id,
        }

    except Exception as e:
        logger.error(f"Error loading model {model_id}: {e}", exc_info=True)
        raise HTTPException(400, f"Error loading model: {e}")

# ─────── ENDPOINT ───────
@router.post("/predict")
async def predict_bilstm(
    file: UploadFile = File(...),
    model_id: str | None = None,
) -> Dict[str, Any]:
    contents = await file.read()
    df = pd.read_csv(BytesIO(contents))
    if df.empty:
        raise HTTPException(400, "Uploaded file is empty")

    # default to your pretrained folder
    model_id = model_id or "pretrained_bilstm"
    return await predict_with_saved_model(df, model_id)
