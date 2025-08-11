# Use official Python base image
FROM python:3.11

# Set working directory
WORKDIR /app

# Copy backend files
COPY ./app /app/app
COPY ./saved_models_bilstm /app/saved_models_bilstm
COPY ./saved_models_rf /app/saved_models_rf
COPY ./saved_models_transformer /app/saved_models_transformer
COPY ./saved_models_xgboost /app/saved_models_xgboost

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Expose FastAPI port
EXPOSE 8000

# Run the app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

