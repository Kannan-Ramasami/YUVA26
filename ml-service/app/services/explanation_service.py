def generate_explanation(model, X_df, feature_names):
    # EBM explain_local
    local_exp = model.explain_local(X_df, y=None, name='explain')
    
    # explain_local returns an explanation object. The local explanations are stored in its data.
    # Since we passed a dataframe with 1 row, data(0) corresponds to our single prediction
    data = local_exp.data(0)
    
    # data has 'names' (features), 'scores' (contributions), and 'extra'
    features = data['names']
    scores = data['scores']
    
    import numpy as np
    contributions = []
    for f, s in zip(features, scores):
        val = float(np.max(s)) if hasattr(s, '__len__') else float(s)
        contributions.append({
            "feature": f,
            "contribution": val
        })
    
    # Sort contributions
    contributions.sort(key=lambda x: x["contribution"], reverse=True)
    
    positive_contributors = [c for c in contributions if c["contribution"] > 0]
    negative_contributors = [c for c in contributions if c["contribution"] < 0]
    
    # Sort negative contributors by absolute magnitude
    negative_contributors.sort(key=lambda x: x["contribution"])

    # Generate summary string
    top_pos = positive_contributors[:2]
    top_neg = negative_contributors[:2]
    
    summary = "Model Explanation: "
    if top_pos:
        pos_names = ", ".join([c["feature"].replace("_", " ") for c in top_pos])
        summary += f"Strong {pos_names} contributed positively to this level estimate. "
    if top_neg:
        neg_names = ", ".join([c["feature"].replace("_", " ") for c in top_neg])
        summary += f"Conversely, lower {neg_names} contributed negatively."
    
    return {
        "positive_contributors": positive_contributors[:5], # Keep top 5
        "negative_contributors": negative_contributors[:5], # Keep top 5
        "summary": summary.strip()
    }
