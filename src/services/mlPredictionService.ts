import type { MLFeatureSet } from './mlFeatureService';

export interface MLPredictionResponse {
  level: string;
  confidence: number;
  probabilities: Record<string, number>;
  explanation?: {
    positive_contributors: Array<{ feature: string; contribution: number }>;
    negative_contributors: Array<{ feature: string; contribution: number }>;
    summary: string;
  };
  model_version: string;
}

/**
 * PHASE 3 ML FOUNDATION: Service Boundary for Python ML Model
 * 
 * This service acts as the boundary between the frontend/Node backend
 * and the Python EBM / ML microservice.
 */
export async function predictLearnerLevel(features: MLFeatureSet): Promise<MLPredictionResponse | null> {
  try {
    const response = await fetch('http://localhost:8000/predict-level', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ features })
    });
    
    if (!response.ok) {
      console.error('[ML Foundation] Prediction failed:', await response.text());
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('[ML Foundation] Python ML Service is unreachable or failed:', error);
    return null;
  }
}
