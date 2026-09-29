import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_model_loads_successfully():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "online", "service": "MasteryFlow ML EBM"}

def test_valid_feature_vector_produces_prediction():
    payload = {
        "features": {
            "overall_accuracy": 0.75,
            "easy_accuracy": 0.90,
            "medium_accuracy": 0.70,
            "hard_accuracy": 0.40,
            "average_response_time": 15.5,
            "median_response_time": 12.0,
            "average_attempts": 1.2,
            "hint_usage_rate": 0.1,
            "recent_accuracy": 0.8,
            "question_count": 20,
            "concept_count": 5,
            "average_bkt_knowledge": 0.7,
            "minimum_bkt_knowledge": 0.4,
            "maximum_bkt_knowledge": 0.9,
            "prerequisite_mastery": 0.65,
            "knowledge_variance": 0.05,
            "recent_bkt_change": 0.05,
            "diagnostic_accuracy": 0.75,
            "diagnostic_question_count": 8
        }
    }
    response = client.post("/predict-level", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert "level" in data
    assert "confidence" in data
    assert "probabilities" in data
    assert "model_version" in data
    
    # Probability output sums approx to 1
    total_prob = sum(data["probabilities"].values())
    assert abs(total_prob - 1.0) < 0.001
    
    # Confidence equals highest prob
    assert data["confidence"] == max(data["probabilities"].values())
    
    # Level belongs to allowed levels
    assert data["level"] in ["BEGINNER", "FOUNDATION", "INTERMEDIATE", "ADVANCED"]

def test_missing_feature_is_rejected():
    payload = {
        "features": {
            "overall_accuracy": 0.75
            # Missing everything else
        }
    }
    response = client.post("/predict-level", json=payload)
    assert response.status_code == 422 # FastAPI validation error

def test_invalid_numerical_value_is_rejected():
    payload = {
        "features": {
            "overall_accuracy": 1.5, # > 1.0 is invalid based on schemas
            "easy_accuracy": 0.90,
            "medium_accuracy": 0.70,
            "hard_accuracy": 0.40,
            "average_response_time": 15.5,
            "median_response_time": 12.0,
            "average_attempts": 1.2,
            "hint_usage_rate": 0.1,
            "recent_accuracy": 0.8,
            "question_count": 20,
            "concept_count": 5,
            "average_bkt_knowledge": 0.7,
            "minimum_bkt_knowledge": 0.4,
            "maximum_bkt_knowledge": 0.9,
            "prerequisite_mastery": 0.65,
            "knowledge_variance": 0.05,
            "recent_bkt_change": 0.05,
            "diagnostic_accuracy": 0.75,
            "diagnostic_question_count": 8
        }
    }
    response = client.post("/predict-level", json=payload)
    assert response.status_code == 422

def test_determinism():
    payload = {
        "features": {
            "overall_accuracy": 0.75,
            "easy_accuracy": 0.90,
            "medium_accuracy": 0.70,
            "hard_accuracy": 0.40,
            "average_response_time": 15.5,
            "median_response_time": 12.0,
            "average_attempts": 1.2,
            "hint_usage_rate": 0.1,
            "recent_accuracy": 0.8,
            "question_count": 20,
            "concept_count": 5,
            "average_bkt_knowledge": 0.7,
            "minimum_bkt_knowledge": 0.4,
            "maximum_bkt_knowledge": 0.9,
            "prerequisite_mastery": 0.65,
            "knowledge_variance": 0.05,
            "recent_bkt_change": 0.05,
            "diagnostic_accuracy": 0.75,
            "diagnostic_question_count": 8
        }
    }
    r1 = client.post("/predict-level", json=payload).json()
    r2 = client.post("/predict-level", json=payload).json()
    
    assert r1 == r2 # Exact same input produces exact same output
