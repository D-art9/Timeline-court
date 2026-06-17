def predict_matchup_win_prob(team_a, team_b):
    """
    Given two CustomTeam models, calculates their win probabilities 
    using the loaded PyTorch model and player embeddings.
    """
    import torch
    from .model_loader import pytorch_loader
    from .feature_builder import build_team_vector, build_matchup_features

    # Get the 5 players for each team
    players_a = [tp.player for tp in team_a.team_players.all()]
    players_b = [tp.player for tp in team_b.team_players.all()]
    
    # 1. Build team vectors (Averages of embeddings)
    vec_a = build_team_vector(players_a)
    vec_b = build_team_vector(players_b)
    
    # 2. Build 12D matchup features
    matchup_features = build_matchup_features(vec_a, vec_b)
    
    # 3. Predict using the PyTorch model
    input_tensor = torch.tensor(matchup_features, dtype=torch.float32).unsqueeze(0)
    
    with torch.no_grad():
        output = pytorch_loader.model(input_tensor)
        team_a_prob = float(output.item())
        team_b_prob = 1.0 - team_a_prob
        
    return {
        "team_a_win_probability": round(team_a_prob, 4),
        "team_b_win_probability": round(team_b_prob, 4)
    }

