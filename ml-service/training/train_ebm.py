import os
import json
import joblib
import pandas as pd
from interpret.glassbox import ExplainableBoostingClassifier
from sklearn.model_selection import train_test_split

def train_ebm():
    print("Loading training data...")
    # Load data
    data_path = "../data/training.csv"
    if not os.path.exists(data_path):
        print("Data file not found. Run generate_synthetic_data.py first.")
        return

    df = pd.read_csv(data_path)

    # Validate
    if "learner_level" not in df.columns:
        raise ValueError("Missing target column 'learner_level'")
    
    df.dropna(inplace=True)

    X = df.drop(columns=["learner_level", "student_id", "timestamp"], errors="ignore")
    y = df["learner_level"]

    feature_names = list(X.columns)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    print("Training ExplainableBoostingClassifier...")
    model = ExplainableBoostingClassifier(random_state=42)
    model.fit(X_train, y_train)

    print("Saving model and metadata...")
    os.makedirs("../app/models", exist_ok=True)
    os.makedirs("../app/metadata", exist_ok=True)

    model_path = "../app/models/ebm_learner_level.joblib"
    
    classes = list(model.classes_)
    
    model_data = {
        "model": model,
        "features": feature_names,
        "classes": classes,
        "version": "ebm-v1"
    }

    joblib.dump(model_data, model_path, compress=("lzma", 3))

    metadata = {
        "model_version": "ebm-v1",
        "feature_schema_version": "features-v1",
        "classes": classes,
        "feature_names": feature_names
    }

    with open("../app/metadata/ebm_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"Model saved to {model_path}")
    print("Training complete! Run evaluate_ebm.py to see performance.")

if __name__ == "__main__":
    train_ebm()
