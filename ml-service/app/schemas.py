from pydantic import BaseModel, Field
from typing import Dict, List, Optional

class MLFeatureSet(BaseModel):
    overall_accuracy: float = Field(..., ge=0.0, le=1.0)
    easy_accuracy: float = Field(..., ge=0.0, le=1.0)
    medium_accuracy: float = Field(..., ge=0.0, le=1.0)
    hard_accuracy: float = Field(..., ge=0.0, le=1.0)
    average_response_time: float = Field(..., ge=0.0)
    median_response_time: float = Field(..., ge=0.0)
    average_attempts: float = Field(..., ge=1.0)
    hint_usage_rate: float = Field(..., ge=0.0, le=1.0)
    recent_accuracy: float = Field(..., ge=0.0, le=1.0)
    question_count: int = Field(..., ge=0)
    concept_count: int = Field(..., ge=0)
    average_bkt_knowledge: float = Field(..., ge=0.0, le=1.0)
    minimum_bkt_knowledge: float = Field(..., ge=0.0, le=1.0)
    maximum_bkt_knowledge: float = Field(..., ge=0.0, le=1.0)
    prerequisite_mastery: float = Field(..., ge=0.0, le=1.0)
    knowledge_variance: float = Field(..., ge=0.0)
    recent_bkt_change: float = Field(..., ge=-1.0, le=1.0)
    diagnostic_accuracy: float = Field(..., ge=0.0, le=1.0)
    diagnostic_question_count: int = Field(..., ge=0)

class PredictLevelRequest(BaseModel):
    features: MLFeatureSet

class FeatureContribution(BaseModel):
    feature: str
    contribution: float

class Explanation(BaseModel):
    positive_contributors: List[FeatureContribution]
    negative_contributors: List[FeatureContribution]
    summary: str

class PredictLevelResponse(BaseModel):
    level: str
    confidence: float
    probabilities: Dict[str, float]
    explanation: Explanation
    model_version: str
