import os

# 🔇 TensorFlow logs
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["TF_CPP_MIN_VLOG_LEVEL"] = "3"
os.environ["AUTOGRAPH_VERBOSITY"] = "0"
os.environ["MLIR_CRASH_REPRODUCER_DIRECTORY"] = "/dev/null"

# 🔇 Disable absl logging (used by XLA backend)
import absl.logging
absl.logging.set_verbosity(absl.logging.FATAL)
absl.logging.set_stderrthreshold('fatal')

# Must come before importing anything from tensorflow
import absl.logging
absl.logging.set_verbosity(absl.logging.ERROR)
absl.logging.set_stderrthreshold('error')

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import numpy as np
import os
import joblib
import logging
from typing import Optional
from tensorflow.keras.models import load_model
from app import randomforest, xgboost, transformer, bilstm  # Added bilstm module import
import warnings
from sklearn.exceptions import InconsistentVersionWarning
app = FastAPI()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Include the routers from different modules
app.include_router(randomforest.router)
app.include_router(xgboost.router)
app.include_router(transformer.router)
app.include_router(bilstm.router)  # Added BiLSTM router
warnings.filterwarnings("ignore", category=InconsistentVersionWarning)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Consider using environment variables for this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model file mapping - updated to include all models
model_file_map = {
    "xgboost": "XGBoost",
    "randomforest": "RF",
    "bilstm": "BiLSTM",
    "transformer": "Transformer"
}

def get_file_path(model: str, filetype: str) -> str:
    model = model.lower()
    if model not in model_file_map:
        raise ValueError("Invalid model name")
    model_folder = f"app/data/{model}"
    filename = f"{filetype}_{model_file_map[model]}.csv"
    return os.path.join(model_folder, filename)

@app.get("/metrics/{model}")
def get_metrics(model: str):
    model = model.lower()
    try:
        filepath = get_file_path(model, "evaluation_metrics")
        df = pd.read_csv(filepath)
        return df.to_dict(orient="records")
    except FileNotFoundError:
        logger.error(f"Metrics file not found for model: {model}")
        raise HTTPException(status_code=404, detail=f"Metrics file not found for model: {model}")
    except Exception as e:
        logger.error(f"Error retrieving metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/feature-importance/{model}")
def get_feature_importance(model: str):
    model = model.lower()
    try:
        filepath = get_file_path(model, "feature_importance")
        df = pd.read_csv(filepath, index_col=0)
        return df.to_dict()
    except FileNotFoundError:
        logger.error(f"Feature importance file not found for model: {model}")
        raise HTTPException(status_code=404, detail=f"Feature importance file not found for model: {model}")
    except Exception as e:
        logger.error(f"Error retrieving feature importance: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/residuals/{model}")
def get_residuals(model: str):
    model = model.lower()
    try:
        filepath = get_file_path(model, "residuals")
        df = pd.read_csv(filepath)
        return df.to_dict(orient="records")
    except FileNotFoundError:
        logger.error(f"Residuals file not found for model: {model}")
        raise HTTPException(status_code=404, detail=f"Residuals file not found for model: {model}")
    except Exception as e:
        logger.error(f"Error retrieving residuals: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/predictions/{model}")
def get_predictions(model: str):
    model = model.lower()
    try:
        if model not in model_file_map:
            raise HTTPException(status_code=404, detail="Invalid model name")
        model_file = model_file_map[model]
        filepath = f"app/data/{model}/PastFuture_Predictions_{model_file}.csv"
        df = pd.read_csv(filepath)
        return df.to_dict(orient="records")
    except FileNotFoundError:
        logger.error(f"Predictions file not found for model: {model}")
        raise HTTPException(status_code=404, detail=f"Predictions file not found for model: {model}")
    except Exception as e:
        logger.error(f"Error retrieving predictions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/anomalies/{model}")
def get_anomalies(model: str):
    try:
        filepath = "app/data/anomalies/anomalies_full_timeseries1.csv"
        df = pd.read_csv(filepath)
        df = df.replace({np.nan: None, np.inf: None, -np.inf: None})
        return df.to_dict(orient="records")
    except FileNotFoundError:
        logger.error("Anomalies file not found")
        raise HTTPException(status_code=404, detail="Anomalies file not found")
    except Exception as e:
        logger.error(f"Error retrieving anomalies: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    """Health check endpoint to verify API is running."""
    return {"status": "healthy"}



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)