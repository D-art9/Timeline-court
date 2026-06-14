from .embedding_service import embedding_service

def build_team_vector(players):
    """
    Takes 5 player profiles, looks up their 6D embeddings,
    and returns their average vector.
    """
    if not players:
        return [0.0] * 6
        
    vectors = []
    for player in players:
        name = player.player_name if hasattr(player, 'player_name') else str(player)
        vectors.append(embedding_service.get_player_embedding(name))
        
    # Calculate the average vector
    avg_vector = [0.0] * 6
    for i in range(6):
        avg_vector[i] = sum(v[i] for v in vectors) / len(vectors)
    return avg_vector

def build_matchup_features(team_a_vector, team_b_vector):
    """
    Concatenates Team A and Team B vectors to form a 12-dimensional vector.
    """
    return team_a_vector + team_b_vector
