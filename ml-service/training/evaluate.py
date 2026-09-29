import pandas as pd
import joblib
import json
import os
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

def evaluate():
    print("Loading test data and model...")
    try:
        X_test = pd.read_csv("X_test.csv")
        y_test = pd.read_csv("y_test.csv")
        y_test = y_test["learner_level"]
        
        model_data = joblib.load("../app/models/random_forest.joblib")
        model = model_data["model"]
        features = model_data["features"]
    except FileNotFoundError as e:
        print(f"Error loading files: {e}. Run train_random_forest.py first.")
        return

    # Ensure feature order matches exactly
    X_test = X_test[features]

    print("Evaluating model...")
    y_pred = model.predict(X_test)
    
    # Calculate metrics
    accuracy = accuracy_score(y_test, y_pred)
    
    # Use macro average because classes represent different levels
    precision = precision_score(y_test, y_pred, average="macro", zero_division=0)
    recall = recall_score(y_test, y_pred, average="macro", zero_division=0)
    f1 = f1_score(y_test, y_pred, average="macro", zero_division=0)
    
    cm = confusion_matrix(y_test, y_pred, labels=model.classes_)
    
    # Feature Importance
    importances = model.feature_importances_
    feature_importance_dict = {
        feature: float(importance) 
        for feature, importance in zip(features, importances)
    }
    # Sort importances descending
    feature_importance_dict = dict(sorted(feature_importance_dict.items(), key=lambda item: item[1], reverse=True))

    report = {
        "metrics": {
            "accuracy": float(accuracy),
            "precision_macro": float(precision),
            "recall_macro": float(recall),
            "f1_score_macro": float(f1)
        },
        "confusion_matrix": {
            "labels": list(model.classes_),
            "matrix": cm.tolist()
        },
        "feature_importances": feature_importance_dict,
        "dataset_warning": "This accuracy reflects performance on a SYNTHETIC/CURATED prototype dataset. It does not represent real-world student accuracy."
    }

    # Save report
    report_path = "evaluation_report.json"
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)
        
    print(f"Evaluation complete. Report saved to {report_path}")
    print(json.dumps(report["metrics"], indent=2))

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    evaluate()
