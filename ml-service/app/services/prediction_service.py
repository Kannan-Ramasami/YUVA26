import joblib
import os
import pandas as pd
from typing import Dict, Any
from .explanation_service import generate_explanation

MODEL_PATH = os.path.join(os.path.dirname(__file__), "../models/ebm_learner_level.joblib")

_model_cache = None

def load_model():
    global _model_cache
    if _model_cache is None:
        if not os.path.exists(MODEL_PATH):
            raise RuntimeError("Model file not found. Please train the EBM model first.")
        _model_cache = joblib.load(MODEL_PATH)
    return _model_cache

def predict_learner_level(features_dict: Dict[str, float]) -> Dict[str, Any]:
    model_data = load_model()
    model = model_data["model"]
    feature_names = model_data["features"]
    version = model_data["version"]
    classes = model_data["classes"]

    # 1. Ensure features are ordered exactly as in training
    try:
        ordered_features = [features_dict[f] for f in feature_names]
    except KeyError as e:
        raise ValueError(f"Missing required feature: {e}")

    # Convert to DataFrame
    X = pd.DataFrame([ordered_features], columns=feature_names)

    # 2. Predict
    prediction = model.predict(X)[0]
    
    # 3. Probabilities
    proba_array = model.predict_proba(X)[0]
    
    probabilities = {
        cls: float(prob) for cls, prob in zip(classes, proba_array)
    }

    # 4. Confidence is the highest probability
    confidence = max(probabilities.values())

    # 5. Local Explanation using EBM explain_local
    explanation = generate_explanation(model, X, feature_names)

    return {
        "level": str(prediction),
        "confidence": float(confidence),
        "probabilities": probabilities,
        "explanation": explanation,
        "model_version": version
    }
