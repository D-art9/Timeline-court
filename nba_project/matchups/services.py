from players.models import CustomTeam, TeamPlayer, Player, PlayerSeasonStats

def get_player_peak_stats(player):
    """
    Returns the PlayerSeasonStats record with the highest points_per_game (Peak Season).
    """
    return player.seasons.order_by('-points_per_game').first()

def calculate_player_metrics(player):
    """
    Calculates deterministic offensive, defensive, and overall scores 
    based on the player's peak season.
    """
    stats = get_player_peak_stats(player)
    if not stats:
        return {
            'off_score': 0.0,
            'def_score': 0.0,
            'overall_score': 0.0,
            'season': None,
            'stats': None
        }
    
    # 1. Offensive Rating Score (Off_Score)
    ppg = stats.points_per_game
    apg = stats.assists_per_game
    ts_pct = stats.true_shooting_pct
    ortg = stats.offensive_rating
    
    off_score = (ppg * 2.0) + (apg * 1.5) + (ts_pct * 100.0 * 0.5) + (ortg * 0.2)
    
    # 2. Defensive Rating Score (Def_Score)
    rpg = stats.rebounds_per_game
    spg = stats.steals_per_game
    bpg = stats.blocks_per_game
    drtg = stats.defensive_rating
    
    def_score = (rpg * 1.0) + (spg * 2.5) + (bpg * 2.5) + ((150.0 - drtg) * 0.3)
    
    # 3. Overall Player Score
    plus_minus = stats.plus_minus
    overall_score = (off_score * 0.6) + (def_score * 0.4) + (plus_minus * 1.0)
    
    return {
        'off_score': round(off_score, 2),
        'def_score': round(def_score, 2),
        'overall_score': round(overall_score, 2),
        'season': stats.season,
        'points_per_game': ppg,
        'rebounds_per_game': rpg,
        'assists_per_game': apg,
        'steals_per_game': spg,
        'blocks_per_game': bpg,
    }

def simulate_matchup(team_a_id, team_b_id):
    """
    Runs the deterministic comparison engine between two team lineups.
    """
    team_a = CustomTeam.objects.get(id=team_a_id)
    team_b = CustomTeam.objects.get(id=team_b_id)
    
    positions = ['PG', 'SG', 'SF', 'PF', 'C']
    
    # Fetch roster mappings
    roster_a = {tp.lineup_position: tp.player for tp in team_a.team_players.all()}
    roster_b = {tp.lineup_position: tp.player for tp in team_b.team_players.all()}
    
    # Verify full 5-player rosters
    for pos in positions:
        if pos not in roster_a or pos not in roster_b:
            raise ValueError(f"Both teams must have a complete 5-player lineup to simulate a matchup.")
            
    # Calculate metrics for all 10 players
    metrics_a = {pos: calculate_player_metrics(roster_a[pos]) for pos in positions}
    metrics_b = {pos: calculate_player_metrics(roster_b[pos]) for pos in positions}
    
    # Calculate team-level aggregates
    team_off_a = sum(metrics_a[pos]['off_score'] for pos in positions)
    team_def_a = sum(metrics_a[pos]['def_score'] for pos in positions)
    base_score_a = sum(metrics_a[pos]['overall_score'] for pos in positions)
    
    team_off_b = sum(metrics_b[pos]['off_score'] for pos in positions)
    team_def_b = sum(metrics_b[pos]['def_score'] for pos in positions)
    base_score_b = sum(metrics_b[pos]['overall_score'] for pos in positions)
    
    # Run position matchup analysis & award localized tactical bonuses (+2 points per spot)
    matchup_analysis = []
    bonus_a = 0.0
    bonus_b = 0.0
    
    for pos in positions:
        player_a = roster_a[pos]
        player_b = roster_b[pos]
        val_a = metrics_a[pos]['overall_score']
        val_b = metrics_b[pos]['overall_score']
        
        diff = round(abs(val_a - val_b), 2)
        if val_a > val_b:
            winner = 'Team A'
            bonus_a += 2.0
            description = f"{player_a.player_name} ({pos}) outmatches {player_b.player_name} by {diff} points."
        elif val_b > val_a:
            winner = 'Team B'
            bonus_b += 2.0
            description = f"{player_b.player_name} ({pos}) outmatches {player_a.player_name} by {diff} points."
        else:
            winner = 'Tie'
            description = f"{player_a.player_name} and {player_b.player_name} ({pos}) are evenly matched."
            
        matchup_analysis.append({
            'position': pos,
            'player_a': player_a.player_name,
            'player_b': player_b.player_name,
            'score_a': val_a,
            'score_b': val_b,
            'winner': winner,
            'advantage': description
        })
        
    rating_a = round(base_score_a + bonus_a, 2)
    rating_b = round(base_score_b + bonus_b, 2)
    
    # Calculate win probabilities
    total_rating = rating_a + rating_b
    if total_rating > 0:
        win_prob_a = round(rating_a / total_rating, 4)
        win_prob_b = round(rating_b / total_rating, 4)
    else:
        win_prob_a = 0.5
        win_prob_b = 0.5
        
    # Predicted winner
    if rating_a > rating_b:
        predicted_winner = team_a.name
    elif rating_b > rating_a:
        predicted_winner = team_b.name
    else:
        predicted_winner = 'Tie'
        
    # Determine team offensive & defensive advantage
    off_adv = team_a.name if team_off_a > team_off_b else (team_b.name if team_off_b > team_off_a else 'Even')
    def_adv = team_a.name if team_def_a > team_def_b else (team_b.name if team_def_b > team_def_a else 'Even')
    
    # Find Best Player (Matchup MVP)
    all_players = []
    for pos in positions:
        all_players.append((roster_a[pos].player_name, metrics_a[pos]['overall_score'], team_a.name))
        all_players.append((roster_b[pos].player_name, metrics_b[pos]['overall_score'], team_b.name))
    all_players.sort(key=lambda x: x[1], reverse=True)
    
    best_player_name, best_player_score, best_player_team = all_players[0]
    
    return {
        'team_a': {
            'id': team_a.id,
            'name': team_a.name,
            'rating': rating_a,
            'off_rating': round(team_off_a, 2),
            'def_rating': round(team_def_a, 2),
            'win_probability': win_prob_a
        },
        'team_b': {
            'id': team_b.id,
            'name': team_b.name,
            'rating': rating_b,
            'off_rating': round(team_off_b, 2),
            'def_rating': round(team_def_b, 2),
            'win_probability': win_prob_b
        },
        'predicted_winner': predicted_winner,
        'offensive_advantage': off_adv,
        'defensive_advantage': def_adv,
        'best_player': f"{best_player_name} ({best_player_team}) - Score: {best_player_score}",
        'position_matchups': matchup_analysis
    }
