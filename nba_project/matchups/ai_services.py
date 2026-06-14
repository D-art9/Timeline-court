from django.conf import settings
from players.models import Player, PlayerSeasonStats
from .analytics import generate_matchup_analytics
from .ai_providers import get_llm_provider
from .ai_prompts import build_matchup_explanation_prompt, build_team_improvement_prompt

def get_ai_matchup_explanation(team_a_id, team_b_id):
    """
    Simulates matchup, generates analytics, builds prompt, and returns LLM interpretation.
    """
    analytics_data = generate_matchup_analytics(team_a_id, team_b_id)
    prompt = build_matchup_explanation_prompt(analytics_data)
    
    provider = get_llm_provider()
    explanation = provider.generate_text(prompt)
    return {
        "simulation_data": analytics_data,
        "explanation": explanation
    }

def get_ai_team_improvements(team_id):
    """
    Analyzes team profiles and recommends improvements from top database players.
    """
    from players.models import CustomTeam
    from .analytics import generate_matchup_analytics
    
    # We can run a dummy simulation against itself to get the team analytics profile
    analytics_data = generate_matchup_analytics(team_id, team_id)
    team_analytics = analytics_data['team_a_analytics']
    
    # Fetch a pool of top players in the database for suggestions
    top_seasons = PlayerSeasonStats.objects.order_by('-points_per_game')[:15]
    player_pool = []
    seen_ids = set()
    for s in top_seasons:
        if s.player.id not in seen_ids:
            seen_ids.add(s.player.id)
            player_pool.append({
                'id': s.player.id,
                'player_name': s.player.player_name,
                'position': s.player.position,
                'ppg': s.points_per_game,
                'rpg': s.rebounds_per_game,
                'apg': s.assists_per_game,
                'spg': s.steals_per_game,
                'bpg': s.blocks_per_game,
                'ts_pct': s.true_shooting_pct
            })
            
    prompt = build_team_improvement_prompt(team_analytics, player_pool)
    provider = get_llm_provider()
    suggestions = provider.generate_text(prompt)
    
    return {
        "team_analytics": team_analytics,
        "suggestions": suggestions
    }
