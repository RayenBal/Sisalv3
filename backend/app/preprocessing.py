# app/preprocessing.py

import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler

def generate_rf_features(df: pd.DataFrame) -> pd.DataFrame:
    df["Age_ka_BP"] = df["Age_1950"] / 1000
    scaler = MinMaxScaler()
    df["Age_norm"] = scaler.fit_transform(df[["Age_ka_BP"]])
    df["Age_diff"] = df["Age_ka_BP"].diff().fillna(0)
    df["d18O_rolling_mean"] = df["d18O"].rolling(window=10, min_periods=1).mean()
    df["d18O_long_rolling"] = df["d18O"].rolling(window=50, min_periods=1).mean()
    df["d18O_rate_of_change"] = df["d18O"].diff().fillna(0) / df["Age_diff"].replace(0, np.nan)
    return df
