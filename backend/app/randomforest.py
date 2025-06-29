from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd
import numpy as np
import joblib
import json
import logging
from pathlib import Path
from io import BytesIO
from typing import Dict, Any

# plotting imports
import matplotlib.pyplot as plt
import seaborn as sns
import scipy.stats as stats
import base64

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
    sns.histplot(y_true - y_pred, kde=True, bins=20, ax=ax)
    ax.set_title(f"{target} Residuals")
    ax.set_xlabel("Residuals")
    return fig

def create_qq_plot(y_true: np.ndarray, y_pred: np.ndarray, target: str) -> plt.Figure:
    fig = plt.figure(figsize=(6, 4))
    stats.probplot(y_true - y_pred, dist="norm", plot=plt)
    plt.title(f"{target} QQ-Plot")
    return fig

def create_short_ts_plot(y_true: np.ndarray, y_pred: np.ndarray, target: str) -> plt.Figure:
    fig, ax = plt.subplots(figsize=(8, 4))
    ax.plot(y_true, label="Actual", alpha=0.7)
    ax.plot(y_pred, label="Predicted", alpha=0.7)
    ax.set_title(f"{target} Actual vs Predicted")
    ax.legend()
    return fig

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
        # ─ load metadata & metrics
        with open(model_dir / "metadata.json")    as f: metadata     = json.load(f)
        with open(model_dir / "test_metrics.json") as f: test_metrics = json.load(f)
        with open(model_dir / "cv_metrics.json")   as f: cv_metrics   = json.load(f)

        # sanitize test_metrics
        for t in TARGET_VARIABLES:
            tm = test_metrics.get(t, {})
            test_metrics[t] = {
                "r2":   float(tm.get("r2",   0.0)),
                "mae":  float(tm.get("mae",  0.0)),
                "rmse": float(tm.get("rmse", 0.0)),
            }
        # build clean CV
        clean_cv = {}
        for t, v in cv_metrics.items():
            scores = v.get("r2_scores", [])
            mean   = v.get("mean_r2", np.mean(scores) if scores else 0.0)
            clean_cv[t] = {"mean_cv_score": float(mean)}

        # ─ load preprocessors
        scaler         = joblib.load(model_dir / "scaler.pkl")
        label_encoders = joblib.load(model_dir / "label_encoders.pkl")

        # ─ preprocess incoming df
        drop_cols = ["sample_id", "site_id", "entity_id", "site_name"]
        df_proc = df.drop(columns=[c for c in drop_cols if c in df.columns], errors="ignore")
        num_cols = df_proc.select_dtypes(include=["float64", "int64"]).columns
        df_proc[num_cols] = df_proc[num_cols].fillna(df_proc[num_cols].median())
        for col, le in label_encoders.items():
            if col in df_proc:
                df_proc[col] = le.transform(df_proc[col].astype(str))
        df_proc[num_cols] = scaler.transform(df_proc[num_cols])

        X = df_proc.drop(columns=TARGET_VARIABLES, errors="ignore")

        # ─ predict per target & build individual plots
        future_past = {}
        plots       = {}
        for t in metadata.get("target_variables", TARGET_VARIABLES):
            pth = model_dir / f"RF_{t}.pkl"
            if not pth.exists():
                logger.warning(f"[rf] Missing model for '{t}'")
                continue
            model = joblib.load(pth)
            preds = model.predict(X)
            future_past[t] = preds.tolist()

            y_true = df_proc[t].values if t in df_proc else preds
            y_seq  = y_true[: len(preds)]

            plots[t] = {
                "residual_plot":    plot_to_base64(create_residual_plot(y_seq, preds, t)),
                "qq_plot":          plot_to_base64(create_qq_plot(y_seq, preds, t)),
                "time_series_plot": plot_to_base64(create_short_ts_plot(y_seq, preds, t)),
            }

        # ─ build combined deep-time trend
        n     = len(next(iter(future_past.values()), []))
        years = np.linspace(-10000, 5000, n)
        fig, ax = plt.subplots(figsize=(10,5))
        for t, vals in future_past.items():
            ax.plot(years, vals, label=t)
        ax.axvline(0, color="r", linestyle="--", label="Present")
        ax.set_xlabel("Years (Past → Future)")
        ax.set_ylabel("Predicted Value")
        ax.legend()
        combined_ts = plot_to_base64(fig)

        logger.info(f"[rf] 🌶️ RandomForest predictions served with sizzle for '{model_id}'!")
        return {
            "status": "success",
            "results": {
                "future_past_predictions":   future_past,
                "years":                     years.tolist(),
                "preprocessing":             metadata.get("preprocessing_info", {}),
                "training_metrics":          test_metrics,
                "evaluation_metrics":        test_metrics,
                "training_cross_validation": clean_cv,
                "plots":                     plots,
                "time_series_plot":          combined_ts,
            },
            "model_id": model_id,
        }

    except Exception as e:
        logger.error(f"[rf] load error: {e}", exc_info=True)
        raise HTTPException(400, f"Error loading model: {e}")
