import os
import joblib
import pandas as pd
import json

def verify_ebm():
    print("1. Verifying EBM environment...")
    try:
        from interpret.glassbox import ExplainableBoostingClassifier
        print("   InterpretML installed successfully.")
    except ImportError:
        print("   FAILED: InterpretML not installed.")
        return

    model_path = "../app/models/ebm_learner_level.joblib"
    metadata_path = "../app/metadata/ebm_metadata.json"
    
    print("2. Verifying model file exists...")
    if not os.path.exists(model_path):
        print(f"   FAILED: {model_path} not found.")
        return
    print("   Model file exists.")
    
    print("3. Loading EBM model...")
    try:
        model_data = joblib.load(model_path)
        model = model_data["model"]
        feature_names = model_data["features"]
        version = model_data["version"]
        print(f"   Model loaded. Version: {version}")
    except Exception as e:
        print(f"   FAILED: Could not load model: {e}")
        return
        
    print("4. Loading metadata...")
    try:
        with open(metadata_path, "r") as f:
            metadata = json.load(f)
        print("   Metadata loaded successfully.")
    except Exception as e:
        print(f"   FAILED: Could not load metadata: {e}")
        return
        
    print("5. Creating valid test feature vector...")
    test_features = {
        "overall_accuracy": 0.72,
        "easy_accuracy": 0.90,
        "medium_accuracy": 0.70,
        "hard_accuracy": 0.45,
        "average_response_time": 18.4,
        "median_response_time": 16.2,
        "average_attempts": 1.3,
        "hint_usage_rate": 0.12,
        "recent_accuracy": 0.76,
        "question_count": 12,
        "concept_count": 6,
        "average_bkt_knowledge": 0.68,
        "minimum_bkt_knowledge": 0.31,
        "maximum_bkt_knowledge": 0.91,
        "prerequisite_mastery": 0.62,
        "knowledge_variance": 0.04,
        "recent_bkt_change": 0.08,
        "diagnostic_accuracy": 0.67,
        "diagnostic_question_count": 8
    }
    
    ordered_features = []
    for f in feature_names:
        if f not in test_features:
            print(f"   FAILED: Missing feature {f}")
            return
        ordered_features.append(test_features[f])
    
    X = pd.DataFrame([ordered_features], columns=feature_names)
    print("   Feature vector created.")
    
    print("6. Running prediction...")
    try:
        prediction = model.predict(X)[0]
        proba = model.predict_proba(X)[0]
        classes = model.classes_
        probabilities = {cls: float(p) for cls, p in zip(classes, proba)}
        confidence = max(probabilities.values())
        print(f"   Predicted Level: {prediction}")
        print(f"   Confidence: {confidence:.4f}")
        print(f"   Probabilities: {probabilities}")
    except Exception as e:
        print(f"   FAILED: Prediction error: {e}")
        return
        
    print("7. Generating EBM feature contributions...")
    try:
        import sys
        sys.path.append(os.path.join(os.path.dirname(__file__), "../app/services"))
        from explanation_service import generate_explanation # type: ignore
        
        explanation = generate_explanation(model, X, feature_names)
        print("   Explanation working.")
        print(f"   Top Positive: {explanation['positive_contributors'][:2]}")
        print(f"   Top Negative: {explanation['negative_contributors'][:2]}")
        print(f"   Summary: {explanation['summary']}")
    except Exception as e:
        print(f"   FAILED: Explanation error: {e}")
        return
        
    print("8. Verifying determinism...")
    prediction2 = model.predict(X)[0]
    if prediction == prediction2:
        print("   Prediction is deterministic.")
    else:
        print("   FAILED: Prediction changed on second run.")
        return
        
    print("\nALL EBM VERIFICATION CHECKS PASSED.")

if __name__ == "__main__":
    verify_ebm()
