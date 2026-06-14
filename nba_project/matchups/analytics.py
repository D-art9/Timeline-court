from players.models import CustomTeam, Player, PlayerSeasonStats
from .services import simulate_matchup, calculate_player_metrics, get_player_peak_stats

def generate_matchup_analytics(team_a_id, team_b_id):
    """
    Runs the base matchup simulation and expands the payload with 
    comprehensive profile averages, stats analytics, and strengths/weaknesses.
    """
    # 1. Fetch simulation results
    sim_data = simulate_matchup(team_a_id, team_b_id)
    
    team_a = CustomTeam.objects.get(id=team_a_id)
    team_b = CustomTeam.objects.get(id=team_b_id)
    
    positions = ['PG', 'SG', 'SF', 'PF', 'C']
    roster_a = {tp.lineup_position: tp.player for tp in team_a.team_players.all()}
    roster_b = {tp.lineup_position: tp.player for tp in team_b.team_players.all()}
    
    # 2. Get Peak season stats and metrics
    stats_a = {pos: get_player_peak_stats(roster_a[pos]) for pos in positions}
    stats_b = {pos: get_player_peak_stats(roster_b[pos]) for pos in positions}
    
    metrics_a = {pos: calculate_player_metrics(roster_a[pos]) for pos in positions}
    metrics_b = {pos: calculate_player_metrics(roster_b[pos]) for pos in positions}
    
    # 3. Overview calculations (Age, Height, Weight, Rating)
    def calculate_overview(roster, stats, metrics):
        ages = [stats[pos].age for pos in positions]
        heights = [roster[pos].height for pos in positions if roster[pos].height]
        weights = [roster[pos].weight for pos in positions if roster[pos].weight]
        ratings = [metrics[pos]['overall_score'] for pos in positions]
        
        return {
            'avg_age': round(sum(ages) / 5.0, 1),
            'avg_height_inches': round(sum(heights) / len(heights), 1) if heights else 0.0,
            'avg_weight_lbs': round(sum(weights) / len(weights), 1) if weights else 0.0,
            'avg_rating': round(sum(ratings) / 5.0, 2)
        }
        
    overview_a = calculate_overview(roster_a, stats_a, metrics_a)
    overview_b = calculate_overview(roster_b, stats_b, metrics_b)
    
    # 4. Offensive analysis
    def calculate_offensive(stats):
        ppg = [stats[pos].points_per_game for pos in positions]
        ortg = [stats[pos].offensive_rating for pos in positions]
        ts = [stats[pos].true_shooting_pct * 100 for pos in positions]
        usage = [stats[pos].usage_rate * 100 for pos in positions]
        
        return {
            'avg_points_per_game': round(sum(ppg) / 5.0, 2),
            'avg_offensive_rating': round(sum(ortg) / 5.0, 2),
            'avg_true_shooting_pct': round(sum(ts) / 5.0, 2),
            'avg_usage_rate_pct': round(sum(usage) / 5.0, 2)
        }
        
    off_a = calculate_offensive(stats_a)
    off_b = calculate_offensive(stats_b)
    
    # 5. Defensive analysis
    def calculate_defensive(stats):
        drtg = [stats[pos].defensive_rating for pos in positions]
        steals = [stats[pos].steals_per_game for pos in positions]
        blocks = [stats[pos].blocks_per_game for pos in positions]
        net = [stats[pos].net_rating for pos in positions]
        
        return {
            'avg_defensive_rating': round(sum(drtg) / 5.0, 2),
            'avg_steals_per_game': round(sum(steals) / 5.0, 2),
            'avg_blocks_per_game': round(sum(blocks) / 5.0, 2),
            'avg_net_rating': round(sum(net) / 5.0, 2)
        }
        
    def_a = calculate_defensive(stats_a)
    def_b = calculate_defensive(stats_b)
    
    # 6. Player Awards
    all_players = []
    for pos in positions:
        all_players.append((roster_a[pos], stats_a[pos], metrics_a[pos], team_a.name))
        all_players.append((roster_b[pos], stats_b[pos], metrics_b[pos], team_b.name))
        
    best_shooter_item = max(all_players, key=lambda x: x[1].true_shooting_pct)
    best_playmaker_item = max(all_players, key=lambda x: x[1].assists_per_game)
    best_defender_item = max(all_players, key=lambda x: x[2]['def_score'])
    
    player_awards = {
        'best_player': sim_data['best_player'],
        'best_defender': f"{best_defender_item[0].player_name} ({best_defender_item[3]}) - Score: {best_defender_item[2]['def_score']}",
        'best_shooter': f"{best_shooter_item[0].player_name} ({best_shooter_item[3]}) - {round(best_shooter_item[1].true_shooting_pct * 100, 1)}% TS",
        'best_playmaker': f"{best_playmaker_item[0].player_name} ({best_playmaker_item[3]}) - {best_playmaker_item[1].assists_per_game} APG"
    }
    
    # 7. Strengths and Weaknesses
    def get_strengths_weaknesses(stats, off, def_m, opp_def_rating):
        strengths = []
        weaknesses = []
        
        # Shooting Strength/Weakness
        if off['avg_true_shooting_pct'] >= 57.0:
            strengths.append("High-efficiency shooting lineup")
        elif off['avg_true_shooting_pct'] <= 53.0:
            weaknesses.append("Below-average shooting efficiency")
            
        # Playmaking Strength/Weakness
        total_assists = sum(stats[pos].assists_per_game for pos in positions)
        if total_assists >= 23.0:
            strengths.append("Elite ball movement and playmaking")
        elif total_assists <= 18.0:
            weaknesses.append("Limited playmaking options")
            
        # Defense Rim/Perimeter
        if def_m['avg_blocks_per_game'] >= 1.2:
            strengths.append("Strong interior rim protection")
        if def_m['avg_steals_per_game'] >= 1.6:
            strengths.append("Active perimeter defense (high steals)")
            
        # Overall Defense Rating
        if def_m['avg_defensive_rating'] <= 104.0:
            strengths.append("Elite lockdown team defense")
        elif def_m['avg_defensive_rating'] >= 108.0:
            weaknesses.append("Defensive vulnerability (high defensive rating)")
            
        # Rebounding
        total_rebounds = sum(stats[pos].rebounds_per_game for pos in positions)
        if total_rebounds >= 43.0:
            strengths.append("Dominant rebounding team")
        elif total_rebounds <= 36.0:
            weaknesses.append("Rebounding vulnerability on possessions")
            
        if not strengths:
            strengths.append("Balanced team metrics")
        if not weaknesses:
            weaknesses.append("No critical performance weaknesses identified")
            
        return strengths, weaknesses
        
    strengths_a, weaknesses_a = get_strengths_weaknesses(stats_a, off_a, def_a, def_b['avg_defensive_rating'])
    strengths_b, weaknesses_b = get_strengths_weaknesses(stats_b, off_b, def_b, def_a['avg_defensive_rating'])
    
    return {
        'simulation': sim_data,
        'team_a_analytics': {
            'overview': overview_a,
            'offensive_profile': off_a,
            'defensive_profile': def_a,
            'strengths': strengths_a,
            'weaknesses': weaknesses_a
        },
        'team_b_analytics': {
            'overview': overview_b,
            'offensive_profile': off_b,
            'defensive_profile': def_b,
            'strengths': strengths_b,
            'weaknesses': weaknesses_b
        },
        'player_awards': player_awards
    }
