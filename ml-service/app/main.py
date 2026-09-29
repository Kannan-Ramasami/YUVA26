from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .schemas import PredictLevelRequest, PredictLevelResponse
from .services.prediction_service import predict_learner_level

app = FastAPI(
    title="MasteryFlow ML Service",
    description="Phase 3 Replacement: Explainable Boosting Machine (EBM) Learner Level Prediction",
    version="1.0.0"
)

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For prototype/hackathon
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "online", "service": "MasteryFlow ML EBM"}

@app.post("/predict-level", response_model=PredictLevelResponse)
def predict_level(request: PredictLevelRequest):
    try:
        features_dict = request.features.model_dump()
        
        result = predict_learner_level(features_dict)
        
        return PredictLevelResponse(
            level=result["level"],
            confidence=result["confidence"],
            probabilities=result["probabilities"],
            explanation=result["explanation"],
            model_version=result["model_version"]
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")
