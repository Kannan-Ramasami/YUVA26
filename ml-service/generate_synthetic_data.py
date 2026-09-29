import pandas as pd
import numpy as np
import os

np.random.seed(42)

def generate_synthetic_dataset(num_samples=1000):
    data = []
    levels = ["BEGINNER", "FOUNDATION", "INTERMEDIATE", "ADVANCED"]
    
    for _ in range(num_samples):
        # Determine base level to synthesize correlated features
        level = np.random.choice(levels, p=[0.25, 0.3, 0.3, 0.15])
        
        # Base stats depending on level
        if level == "BEGINNER":
            acc_base = np.random.uniform(0.1, 0.4)
            bkt_base = np.random.uniform(0.1, 0.3)
            time_base = np.random.uniform(20.0, 40.0)
            hint_base = np.random.uniform(0.4, 0.9)
            attempts_base = np.random.uniform(2.0, 4.0)
        elif level == "FOUNDATION":
            acc_base = np.random.uniform(0.35, 0.65)
            bkt_base = np.random.uniform(0.3, 0.6)
            time_base = np.random.uniform(15.0, 30.0)
            hint_base = np.random.uniform(0.2, 0.6)
            attempts_base = np.random.uniform(1.5, 2.5)
        elif level == "INTERMEDIATE":
            acc_base = np.random.uniform(0.6, 0.85)
            bkt_base = np.random.uniform(0.55, 0.8)
            time_base = np.random.uniform(10.0, 20.0)
            hint_base = np.random.uniform(0.05, 0.3)
            attempts_base = np.random.uniform(1.1, 1.8)
        else: # ADVANCED
            acc_base = np.random.uniform(0.8, 0.98)
            bkt_base = np.random.uniform(0.75, 0.98)
            time_base = np.random.uniform(5.0, 15.0)
            hint_base = np.random.uniform(0.0, 0.1)
            attempts_base = np.random.uniform(1.0, 1.2)
            
        row = {
            "overall_accuracy": np.clip(acc_base + np.random.normal(0, 0.05), 0, 1),
            "easy_accuracy": np.clip(acc_base + 0.15 + np.random.normal(0, 0.05), 0, 1),
            "medium_accuracy": np.clip(acc_base + np.random.normal(0, 0.05), 0, 1),
            "hard_accuracy": np.clip(acc_base - 0.2 + np.random.normal(0, 0.05), 0, 1),
            "average_response_time": max(1.0, time_base + np.random.normal(0, 2)),
            "median_response_time": max(1.0, time_base + np.random.normal(0, 1)),
            "average_attempts": max(1.0, attempts_base + np.random.normal(0, 0.1)),
            "hint_usage_rate": np.clip(hint_base + np.random.normal(0, 0.05), 0, 1),
            "recent_accuracy": np.clip(acc_base + np.random.normal(0, 0.1), 0, 1),
            "question_count": int(np.random.uniform(10, 50)),
            "concept_count": int(np.random.uniform(3, 10)),
            "average_bkt_knowledge": np.clip(bkt_base + np.random.normal(0, 0.05), 0, 1),
            "minimum_bkt_knowledge": np.clip(bkt_base - 0.15 + np.random.normal(0, 0.05), 0, 1),
            "maximum_bkt_knowledge": np.clip(bkt_base + 0.15 + np.random.normal(0, 0.05), 0, 1),
            "prerequisite_mastery": np.clip(bkt_base + np.random.normal(0, 0.1), 0, 1),
            "knowledge_variance": np.clip(np.random.uniform(0, 0.15), 0, 1),
            "recent_bkt_change": np.clip(np.random.normal(0.02, 0.05), -1, 1),
            "diagnostic_accuracy": np.clip(acc_base + np.random.normal(0, 0.08), 0, 1),
            "diagnostic_question_count": 8,
            "learner_level": level
        }
        data.append(row)
        
    df = pd.DataFrame(data)
    os.makedirs(os.path.dirname("data/training.csv"), exist_ok=True)
    df.to_csv("data/training.csv", index=False)
    print(f"Generated synthetic prototype training data with {num_samples} samples.")

if __name__ == "__main__":
    generate_synthetic_dataset()
