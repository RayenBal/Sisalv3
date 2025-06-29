from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
import scipy.stats as stats
from io import BytesIO
import base64
from pathlib import Path
from typing import Dict, Any, List
import warnings
import logging
import os
from datetime import datetime
import uuid
import json
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from sklearn.inspection import permutation_importance
from sklearn.model_selection import train_test_split, KFold, cross_val_score, RandomizedSearchCV
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestRegressor
from concurrent.futures import ThreadPoolExecutor
import asyncio

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

warnings.filterwarnings("ignore", category=UserWarning, module="sklearn")

router = APIRouter(prefix="/api/analyze/rf", tags=["Random Forest"])

TARGET_VARIABLES = [
    "d18O_measurement",
    "d13C_measurement",
    "Mg_Ca_measurement",
    "Sr_Ca_measurement"
]

# Global variables for caching
PREPROCESSED_DATA_CACHE = {}
MODEL_CACHE = {}

# Configuration for saving models
MODEL_SAVE_DIR = Path("saved_models_rf")
MODEL_SAVE_DIR.mkdir(parents=True, exist_ok=True)
def plot_to_base64(fig) -> str:
    """Convert plot to base64 string."""
    buf = BytesIO()
    fig.savefig(buf, format="png", dpi=80, bbox_inches="tight")
    plt.close(fig)
    return base64.b64encode(buf.getvalue()).decode("utf-8")

async def preprocess_data(df: pd.DataFrame) -> Dict[str, Any]:
    """Preprocess data with caching."""
    cache_key = hash(df.to_json())
    if cache_key in PREPROCESSED_DATA_CACHE:
        return PREPROCESSED_DATA_CACHE[cache_key]

    logger.info("🔄 Preprocessing dataset...")
    df_real_data = df.copy()

    # Drop unnecessary columns
    drop_columns = ['sample_id', 'site_id', 'entity_id', 'site_name']
    df_real_data.drop(columns=[col for col in drop_columns if col in df_real_data.columns], 
                     inplace=True, errors='ignore')

    # Handle missing values
    numeric_columns = df_real_data.select_dtypes(include=['float64', 'int64']).columns
    df_real_data[numeric_columns] = df_real_data[numeric_columns].fillna(
        df_real_data[numeric_columns].median(), downcast='infer')

    # Encode categorical variables
    categorical_columns = ['mineralogy', 'monitoring']
    label_encoders = {}
    for col in categorical_columns:
        if col in df_real_data.columns and df_real_data[col].dtype == 'object':
            le = LabelEncoder()
            df_real_data[col] = le.fit_transform(df_real_data[col].astype(str))
            label_encoders[col] = le

    # Calculate correlation and drop highly correlated features
    corr_matrix = df_real_data.corr(method='spearman').abs()
    upper_tri = corr_matrix.where(np.triu(np.ones(corr_matrix.shape), k=1).astype(bool))
    high_corr_features = [column for column in upper_tri.columns if any(upper_tri[column] > 0.9)]
    df_real_data.drop(columns=high_corr_features, inplace=True, errors='ignore')

    # Scale numerical features
    scaler = StandardScaler()
    df_real_data[numeric_columns] = scaler.fit_transform(df_real_data[numeric_columns])

    # Prepare output
    X_real = df_real_data.drop(columns=TARGET_VARIABLES, errors='ignore')
    result = {
        'df': df_real_data,
        'X_real': X_real,
        'label_encoders': label_encoders,
        'scaler': scaler,
        'high_corr_features': high_corr_features
    }
    PREPROCESSED_DATA_CACHE[cache_key] = result
    return result

async def train_model_for_target(X_train, y_train, X_test, y_test, target):
    """Train a model for a specific target."""
    cache_key = hash((X_train.to_json(), y_train.to_json(), target))
    if cache_key in MODEL_CACHE:
        return MODEL_CACHE[cache_key]

    logger.info(f"🔍 Optimizing {target}...")

    # Define hyperparameter space
    param_grid = {
        'n_estimators': [100, 200],
        'max_depth': [10, 15],
        'min_samples_split': [2, 10],
        'min_samples_leaf': [1, 5]
    }

    # Train model using randomized search
    rf = RandomForestRegressor(random_state=42, n_jobs=-1)
    random_search = RandomizedSearchCV(
        rf, param_distributions=param_grid, n_iter=10, cv=3,
        scoring="r2", verbose=0, n_jobs=-1
    )
    random_search.fit(X_train, y_train)

    # Get best model
    model = random_search.best_estimator_

    # Generate predictions
    y_pred = model.predict(X_test)

    # Calculate metrics
    metrics = {
        'r2': r2_score(y_test, y_pred),
        'mae': mean_absolute_error(y_test, y_pred),
        'rmse': np.sqrt(mean_squared_error(y_test, y_pred))
    }

    # Generate plots
    plots = {}
    with ThreadPoolExecutor() as executor:
        future_residual = executor.submit(create_residual_plot, y_test, y_pred, target)
        future_qq = executor.submit(create_qq_plot, y_test, y_pred, target)
        future_importance = executor.submit(create_feature_importance_plot, model, X_test, y_test, target)
        plots['residual_plot'] = future_residual.result()
        plots['qq_plot'] = future_qq.result()
        plots['feature_importance'] = future_importance.result()

    result = {
        'model': model,
        'metrics': metrics,
        'plots': plots,
        'params': random_search.best_params_
    }
    MODEL_CACHE[cache_key] = result
    return result

def create_residual_plot(y_test, y_pred, target):
    """Create residual plot."""
    fig, ax = plt.subplots(figsize=(6, 4))
    sns.histplot(y_test - y_pred, kde=True, bins=20, ax=ax)
    ax.set_title(f"Residual Distribution for {target}")
    ax.set_xlabel("Residuals")
    return plot_to_base64(fig)

def create_qq_plot(y_test, y_pred, target):
    """Create QQ plot."""
    fig = plt.figure(figsize=(6, 4))
    stats.probplot(y_test - y_pred, dist="norm", plot=plt)
    plt.title(f"QQ Plot for {target}")
    return plot_to_base64(fig)

def create_feature_importance_plot(model, X_test, y_test, target):
    """Create feature importance plot."""
    result = permutation_importance(
        model, X_test, y_test, n_repeats=5, random_state=42, n_jobs=-1
    )
    sorted_idx = result.importances_mean.argsort()
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.boxplot(result.importances[sorted_idx].T, vert=False, labels=X_test.columns[sorted_idx])
    ax.set_title(f"Feature Importance for {target}")
    return plot_to_base64(fig)

async def process_data_parallel(df: pd.DataFrame) -> Dict[str, Any]:
    """Process data in parallel for all targets."""
    preprocessed = await preprocess_data(df)
    df_real_data = preprocessed['df']
    X_real = preprocessed['X_real']

    train_test_data = {}
    for target in TARGET_VARIABLES:
        if target in df_real_data.columns:
            X_train, X_test, y_train, y_test = train_test_split(
                X_real, df_real_data[target], test_size=0.2, random_state=42
            )
            train_test_data[target] = {
                'X_train': X_train,
                'X_test': X_test,
                'y_train': y_train,
                'y_test': y_test
            }

    tasks = []
    for target in TARGET_VARIABLES:
        if target in train_test_data:
            data = train_test_data[target]
            tasks.append(
                train_model_for_target(
                    data['X_train'], data['y_train'],
                    data['X_test'], data['y_test'],
                    target
                )
            )

    model_results = await asyncio.gather(*tasks)

    final_results = {}
    evaluation_results = {}
    plots = {}
    final_models = {}
    for target, result in zip([t for t in TARGET_VARIABLES if t in train_test_data], model_results):
        final_results[target] = result
        evaluation_results[target] = result['metrics']
        plots[target] = result['plots']
        final_models[target] = result['model']

    cv_results = {}
    kf = KFold(n_splits=3, shuffle=True, random_state=42)
    for target, model in final_models.items():
        X = X_real
        y = df_real_data[target]
        cv_scores = cross_val_score(model, X, y, cv=kf, scoring="r2", n_jobs=-1)
        cv_results[target] = {
            'cv_scores': cv_scores.tolist(),
            'mean_cv_score': float(cv_scores.mean())
        }

    years = np.linspace(-10000, 5000, len(X_real))
    future_past_predictions = {
        target: model.predict(X_real).tolist()
        for target, model in final_models.items()
    }

    fig, ax = plt.subplots(figsize=(10, 5))
    for target in final_models:
        ax.plot(years, future_past_predictions[target], label=target)
    ax.set_xlabel("Years (Past to Future)")
    ax.set_ylabel("Predicted Value")
    ax.axvline(x=0, color="r", linestyle="--", label="Present (2024)")
    ax.legend()
    time_series_plot = plot_to_base64(fig)

    return {
        'evaluation_metrics': evaluation_results,
        'cross_validation': cv_results,
        'plots': plots,
        'future_past_predictions': future_past_predictions,
        'years': years.tolist(),
        'time_series_plot': time_series_plot,
        'preprocessing': {
            'dropped_columns': ['sample_id', 'site_id', 'entity_id', 'site_name'],
            'high_corr_features': preprocessed['high_corr_features'],
            'label_encoders': preprocessed['label_encoders'],
            'scaler': preprocessed['scaler']
        },
        'models': final_models
    }

def generate_model_id() -> str:
    """Generate a human-readable model ID based on current timestamp and targets."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    return f"rf_model_{timestamp}"

def save_trained_models(results: Dict, model_name: str = None) -> str:
    """Save trained models with verification."""
    try:
        # 1. Create model directory with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        model_id = model_name or f"rf_model_{timestamp}"
        model_dir = MODEL_SAVE_DIR / model_id
        
        # 2. Ensure directory exists
        model_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"🛟 Saving models to: {model_dir.absolute()}")

        # 3. Save all components with verification
        saved_files = []
        
        # Save models
        for target, model in results['models'].items():
            model_path = model_dir / f"{target}_model.pkl"
            try:
                joblib.dump(model, model_path)
                saved_files.append(model_path)
                logger.info(f"✅ Saved {target} model to {model_path}")
            except Exception as e:
                logger.error(f"❌ Failed to save {target} model: {str(e)}")
                raise

        # Save preprocessing artifacts
        scaler_path = model_dir / "scaler.pkl"
        joblib.dump(results['preprocessing']['scaler'], scaler_path)
        saved_files.append(scaler_path)

        label_encoders_path = model_dir / "label_encoders.pkl"
        joblib.dump(results['preprocessing']['label_encoders'], label_encoders_path)
        saved_files.append(label_encoders_path)

        # Save metadata
        metadata = {
            'created_at': datetime.now().isoformat(),
            'model_type': 'RandomForest',
            'targets': list(results['models'].keys()),
            'metrics': results['evaluation_metrics'],
            'preprocessing': {
                'dropped_columns': results['preprocessing']['dropped_columns'],
                'high_corr_features': results['preprocessing']['high_corr_features'],
                'label_encoder_classes': {
                    k: list(v.classes_)
                    for k, v in results['preprocessing']['label_encoders'].items()
                }
            }
        }
        metadata_path = model_dir / "metadata.json"
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        saved_files.append(metadata_path)

        # 4. Verify all files were saved
        missing = [f for f in saved_files if not f.exists()]
        if missing:
            raise FileNotFoundError(f"Failed to save: {missing}")

        logger.info(f"🚀 Successfully saved model {model_id} with {len(saved_files)} files")
        return model_id

    except Exception as e:
        logger.error(f"❌ Failed to save models: {str(e)}")
        # Clean up any partial saves
        if 'model_dir' in locals():
            for f in model_dir.glob('*'):
                try:
                    f.unlink()
                except:
                    pass
            try:
                model_dir.rmdir()
            except:
                pass
        raise HTTPException(
            status_code=500,
            detail=f"Model saving failed: {str(e)}"
        )

def load_saved_model(model_id: str) -> Dict:
    """Load a previously saved model with verification."""
    try:
        model_dir = MODEL_SAVE_DIR / model_id
        if not model_dir.exists():
            raise FileNotFoundError(f"Model directory not found: {model_dir}")

        # Load metadata first
        metadata_path = model_dir / "metadata.json"
        if not metadata_path.exists():
            raise FileNotFoundError("Metadata file not found")
        
        with open(metadata_path, "r") as f:
            metadata = json.load(f)

        # Verify model type
        if metadata.get('model_type') != 'RandomForest':
            raise ValueError("This is not a RandomForest model")

        # Load models
        models = {}
        for target in metadata['target_variables']:
            model_path = model_dir / f"{target}_model.pkl"
            if not model_path.exists():
                raise FileNotFoundError(f"Model file not found for target {target}")
            models[target] = joblib.load(model_path)

        # Load preprocessing artifacts
        scaler_path = model_dir / "scaler.pkl"
        label_encoders_path = model_dir / "label_encoders.pkl"
        
        if not scaler_path.exists():
            raise FileNotFoundError("Scaler file not found")
        if not label_encoders_path.exists():
            raise FileNotFoundError("Label encoders file not found")

        preprocessor = {
            'scaler': joblib.load(scaler_path),
            'label_encoders': joblib.load(label_encoders_path),
            'dropped_columns': metadata['preprocessing_info']['dropped_columns'],
            'high_corr_features': metadata['preprocessing_info']['high_corr_features']
        }

        return {
            'models': models,
            'metadata': metadata,
            'preprocessor': preprocessor
        }
    except Exception as e:
        logger.error(f"Error loading model {model_id}: {str(e)}")
        raise

async def predict_with_model(df: pd.DataFrame, model_id: str) -> Dict:
    """Make predictions using a saved model with proper preprocessing."""
    try:
        # Load the saved model and preprocessing artifacts
        saved_data = load_saved_model(model_id)
        models = saved_data['models']
        preprocessor = saved_data['preprocessor']

        # Preprocess the new data similarly to training data
        df_processed = df.copy()
        
        # Drop columns that were dropped during training
        df_processed.drop(
            columns=[col for col in preprocessor['dropped_columns'] 
                    if col in df_processed.columns],
            inplace=True, errors='ignore'
        )

        # Handle missing values
        numeric_cols = df_processed.select_dtypes(include=['float64', 'int64']).columns
        df_processed[numeric_cols] = df_processed[numeric_cols].fillna(
            df_processed[numeric_cols].median(), downcast='infer')

        # Encode categorical variables
        for col, le in preprocessor['label_encoders'].items():
            if col in df_processed.columns:
                # Handle unseen categories by marking them as -1
                df_processed[col] = df_processed[col].apply(
                    lambda x: le.transform([x])[0] if x in le.classes_ else -1
                )

        # Drop highly correlated features
        df_processed.drop(
            columns=preprocessor['high_corr_features'],
            inplace=True, errors='ignore'
        )

        # Scale numerical features
        numeric_cols = df_processed.select_dtypes(include=['float64', 'int64']).columns
        df_processed[numeric_cols] = preprocessor['scaler'].transform(df_processed[numeric_cols])

        # Prepare features for prediction
        X_new = df_processed.drop(columns=TARGET_VARIABLES, errors='ignore')

        # Make predictions
        predictions = {
            target: model.predict(X_new).tolist()
            for target, model in models.items()
        }

        # Generate time series plot
        years = np.linspace(-10000, 5000, len(X_new))
        fig, ax = plt.subplots(figsize=(10, 5))
        for target, preds in predictions.items():
            ax.plot(years, preds, label=target)
        ax.set_xlabel("Years (Past to Future)")
        ax.set_ylabel("Predicted Value")
        ax.axvline(x=0, color="r", linestyle="--", label="Present (2024)")
        ax.legend()
        time_series_plot = plot_to_base64(fig)

        return {
            'status': 'success',
            'model_id': model_id,
            'predictions': predictions,
            'years': years.tolist(),
            'time_series_plot': time_series_plot,
            'model_metrics': saved_data['metadata']['metrics'],
            'plots': saved_data['metadata'].get('plots', {})
        }

    except Exception as e:
        logger.error(f"Prediction error with model {model_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=400,
            detail=f"Prediction failed: {str(e)}"
        )

@router.post("/predict")
async def predict_rf(
    file: UploadFile = File(...),
    model_id: str = None,
    save_model: bool = False,
    model_name: str = None
):
    """Endpoint for making predictions or training new models."""
    try:
        contents = await file.read()
        df = pd.read_csv(BytesIO(contents))

        if model_id:
            # Use existing model for prediction
            result = await predict_with_model(df, model_id)
        else:
            # Train new models
            results = await process_data_parallel(df)

            # Prepare response
            response = {
                "status": "success",
                "results": {
                    "evaluation_metrics": results["evaluation_metrics"],
                    "cross_validation": results["cross_validation"],
                    "future_past_predictions": results["future_past_predictions"],
                    "years": results["years"],
                    "time_series_plot": results["time_series_plot"],
                    "plots": results["plots"],
                    "preprocessing": {
                        "dropped_columns": results["preprocessing"]["dropped_columns"],
                        "high_corr_features": results["preprocessing"]["high_corr_features"],
                        "label_encoders": {
                            k: list(v.classes_)
                            for k, v in results["preprocessing"]["label_encoders"].items()
                        }
                    }
                }
            }

            # Save models if requested
            if save_model:
                try:
                    model_id = save_trained_models(results, model_name)
                    response['model_id'] = model_id
                    response['message'] = "Model saved successfully"
                    logger.info(f"Successfully saved model with ID: {model_id}")
                except Exception as save_error:
                    logger.error(f"Failed to save model: {str(save_error)}")
                    response['message'] = f"Model saving failed: {str(save_error)}"
            
            return response

    except Exception as e:
        logger.error(f"Error processing file: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=400,
            detail=f"Error processing file: {str(e)}"
        )

@router.get("/models")
async def list_saved_models():
    """List all available saved models with their metadata."""
    models = []
    for model_dir in MODEL_SAVE_DIR.iterdir():
        if model_dir.is_dir():
            try:
                metadata_path = model_dir / "metadata.json"
                if metadata_path.exists():
                    with open(metadata_path, "r") as f:
                        metadata = json.load(f)
                    models.append({
                        'model_id': model_dir.name,
                        'created_at': metadata['created_at'],
                        'model_type': metadata.get('model_type', 'Unknown'),
                        'targets': metadata['target_variables'],
                        'metrics': metadata['metrics']
                    })
            except Exception as e:
                logger.warning(f"Could not load metadata for {model_dir.name}: {str(e)}")
    return sorted(models, key=lambda x: x['created_at'], reverse=True)

@router.get("/models/{model_id}")
async def get_model_details(model_id: str):
    """Get detailed information about a specific model."""
    try:
        model_data = load_saved_model(model_id)
        return {
            'status': 'success',
            'model_id': model_id,
            'details': model_data['metadata'],
            'preprocessing_info': {
                'dropped_columns': model_data['preprocessor']['dropped_columns'],
                'high_corr_features': model_data['preprocessor']['high_corr_features'],
                'label_encoders': {
                    k: list(v.classes_)
                    for k, v in model_data['preprocessor']['label_encoders'].items()
                }
            }
        }
    except Exception as e:
        logger.error(f"Error retrieving model {model_id}: {str(e)}")
        raise HTTPException(
            status_code=404,
            detail=f"Model not found or could not be loaded: {str(e)}"
        )

@router.delete("/models/{model_id}")
async def delete_model(model_id: str):
    """Delete a saved model and all its files."""
    try:
        model_dir = MODEL_SAVE_DIR / model_id
        if not model_dir.exists():
            raise HTTPException(status_code=404, detail="Model not found")

        # Delete all files in the directory
        for file in model_dir.glob("*"):
            file.unlink()

        # Remove the directory
        model_dir.rmdir()

        return {"status": "success", "message": f"Model {model_id} deleted"}
    except Exception as e:
        logger.error(f"Error deleting model {model_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=400,
            detail=f"Error deleting model: {str(e)}"
        )