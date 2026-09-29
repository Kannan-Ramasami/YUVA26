import os
import json
import joblib
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split

def evaluate_ebm():
    print("Loading model and data for evaluation...")
    data_path = "../data/training.csv"
    model_path = "../app/models/ebm_learner_level.joblib"

    if not os.path.exists(data_path) or not os.path.exists(model_path):
        print("Required files missing. Run train_ebm.py first.")
        return

    df = pd.read_csv(data_path).dropna()
    model_data = joblib.load(model_path)
    
    model = model_data["model"]
    feature_names = model_data["features"]
    
    X = df[feature_names]
    y = df["learner_level"]

    _, X_test, _, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    print("Evaluating ExplanableBoostingClassifier on test set...")
    y_pred = model.predict(X_test)

    acc = accuracy_score(y_test, y_pred)
    report_dict = classification_report(y_test, y_pred, output_dict=True)
    cm = confusion_matrix(y_test, y_pred, labels=model.classes_).tolist()

    print(f"Accuracy: {acc:.4f}")
    
    macro_f1 = report_dict["macro avg"]["f1-score"]
    print(f"Macro F1: {macro_f1:.4f}")

    eval_report = {
        "accuracy": acc,
        "macro_f1": macro_f1,
        "classification_report": report_dict,
        "confusion_matrix": cm,
        "classes": list(model.classes_)
    }

    report_path = "evaluation_report.json"
    with open(report_path, "w") as f:
        json.dump(eval_report, f, indent=2)

    print(f"Evaluation report saved to {report_path}")

if __name__ == "__main__":
    evaluate_ebm()
