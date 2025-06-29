from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd
import numpy as np
import io
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from joblib import load
from tensorflow.keras.models import load_model

router = APIRouter()

# Load models
xgb_model = load("app/models/esam_xgb.pkl")
bilstm_model = load_model("app/models/esam_bilstm.h5", compile=False)

# Helper for XGBoost features
def prepare_xgb_features(df: pd.DataFrame) -> pd.DataFrame:
    if "Age_1950" not in df.columns or "d18O" not in df.columns:
        raise HTTPException(status_code=400, detail="Missing required columns: 'Age_1950' or 'd18O'")

    df = df.copy()
    df["Age_ka_BP"] = df["Age_1950"] / 1000
    df["Age_norm"] = (df["Age_ka_BP"] - df["Age_ka_BP"].mean()) / df["Age_ka_BP"].std()
    df["Age_diff"] = df["Age_ka_BP"].diff().fillna(0)
    df["d18O_rolling_mean"] = df["d18O"].rolling(window=10, min_periods=1).mean()
    df["d18O_long_rolling"] = df["d18O"].rolling(window=50, min_periods=1).mean()
    df["d18O_rate_of_change"] = df["d18O"].diff().fillna(0) / df["Age_diff"].replace(0, np.nan)

    return df

@router.post("/predict/{model}")
async def predict(model: str, file: UploadFile = File(...)):
    content = await file.read()
    df = pd.read_csv(io.StringIO(content.decode("utf-8")))

    if model == "xgboost":
        df = prepare_xgb_features(df)
        features = [
            "Age_ka_BP", "Age_norm", "Age_diff",
            "d18O_rolling_mean", "d18O_long_rolling", "d18O_rate_of_change"
        ]

        if not all(f in df.columns for f in features):
            return {"error": f"Missing one or more required features: {features}"}

        y_true = df["d18O"] if "d18O" in df else None
        y_pred = xgb_model.predict(df[features])
        df["prediction"] = y_pred

        # Handle NaN values
        df = df.fillna(0)  # or use df.dropna() if you prefer to drop rows with NaN values

        result = {"predictions": df.to_dict(orient="records")}

        if y_true is not None:
            mae = mean_absolute_error(y_true, y_pred)
            rmse = np.sqrt(mean_squared_error(y_true, y_pred))
            r2 = r2_score(y_true, y_pred)
            result["metrics"] = {"mae": mae, "rmse": rmse, "r2": r2}

        return result

    elif model == "bilstm":
        if "d18O_measurement" not in df:
            return {"error": "Missing 'd18O_measurement' column for BiLSTM prediction."}

        seq = df["d18O_measurement"].values.reshape(-1, 1)
        win = 20
        if len(seq) <= win:
            return {"error": f"Not enough data points. BiLSTM requires at least {win+1} samples."}

        X = np.array([seq[i - win:i] for i in range(win, len(seq))])
        preds = bilstm_model.predict(X).flatten()
        output_df = df.iloc[win:].copy()
        output_df["prediction"] = preds

        # Handle NaN values
        output_df = output_df.fillna(0)  # or use output_df.dropna() if you prefer to drop rows with NaN values

        return {"predictions": output_df.to_dict(orient="records")}

    return {"error": "Invalid model name provided."}
