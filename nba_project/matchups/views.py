import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .analytics import generate_matchup_analytics
from .models import SimulationHistory
from players.models import CustomTeam, Player
from .ai_services import get_ai_matchup_explanation, get_ai_team_improvements
from .ai_providers import get_llm_provider

class MatchupSimulationView(APIView):
    """
    API view to simulate a matchup between two saved custom teams
    and generate detailed analytics dashboard insights.
    Expects JSON body: {"team_a": <id>, "team_b": <id>, "simulation_type": "ml"|"rule_based"}
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        team_a_id = request.data.get('team_a') or request.data.get('team_a_id')
        team_b_id = request.data.get('team_b') or request.data.get('team_b_id')
        sim_type = request.data.get('simulation_type', 'rule_based').lower()
        
        if not team_a_id or not team_b_id:
            return Response(
                {"error": "Both 'team_a' and 'team_b' team IDs must be provided in the request body."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            simulation_result = generate_matchup_analytics(team_a_id, team_b_id)
            
            team_a = CustomTeam.objects.get(id=team_a_id)
            team_b = CustomTeam.objects.get(id=team_b_id)
            
            if sim_type == 'ml':
                ml_prob = predict_matchup_win_prob(team_a, team_b)
                prob_a = ml_prob['team_a_win_probability']
                prob_b = ml_prob['team_b_win_probability']
                
                simulation_result['team_a']['win_probability'] = prob_a
                simulation_result['team_b']['win_probability'] = prob_b
                
                if prob_a > prob_b:
                    simulation_result['predicted_winner'] = team_a.name
                elif prob_b > prob_a:
                    simulation_result['predicted_winner'] = team_b.name
                else:
                    simulation_result['predicted_winner'] = 'Tie'
            
            predicted_winner = simulation_result['predicted_winner']
            
            if predicted_winner == team_a.name:
                win_prob = simulation_result['team_a']['win_probability']
            else:
                win_prob = simulation_result['team_b']['win_probability']
                
            SimulationHistory.objects.create(
                user=request.user,
                team_a=team_a,
                team_b=team_b,
                winner_name=f"{predicted_winner} ({sim_type.upper()})",
                win_probability=win_prob
            )
            
            # Map to requested frontend keys at root level
            rating_a = simulation_result.get('team_a', {}).get('rating', 100.0)
            rating_b = simulation_result.get('team_b', {}).get('rating', 100.0)
            total = rating_a + rating_b
            score_a = round(90 + (rating_a / total) * 35)
            score_b = round(90 + (rating_b / total) * 35)

            # Keep existing structure but add root-level aliases
            simulation_result['winner'] = predicted_winner
            simulation_result['probability_a'] = simulation_result['team_a']['win_probability']
            simulation_result['probability_b'] = simulation_result['team_b']['win_probability']
            simulation_result['score_a'] = score_a
            simulation_result['score_b'] = score_b
            simulation_result['ratings'] = {
                'team_a': rating_a,
                'team_b': rating_b
            }
            simulation_result['mvp player'] = simulation_result['best_player']
            simulation_result['mvp_player'] = simulation_result['best_player']
            simulation_result['position_battles'] = simulation_result['position_matchups']
            
            return Response(simulation_result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class MatchupAIAnalystView(APIView):
    """
    API endpoint to analyze lineups, explain matchup outcomes, or compare players.
    Expects POST request.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        question = request.data.get('question', '').strip()
        team_a_id = request.data.get('team_a_id')
        team_b_id = request.data.get('team_b_id')
        player_a_id = request.data.get('player_a_id')
        player_b_id = request.data.get('player_b_id')

        # Scenario 1: Player Comparison
        if player_a_id and player_b_id:
            try:
                p1 = Player.objects.get(id=player_a_id)
                p2 = Player.objects.get(id=player_b_id)
                
                s1 = p1.seasons.order_by('-points_per_game').first()
                s2 = p2.seasons.order_by('-points_per_game').first()
                
                if not s1 or not s2:
                    return Response({"error": "Stats not found for these players."}, status=status.HTTP_400_BAD_REQUEST)
                
                prompt = f"""
You are an expert NBA Analyst. Compare the following two players using their peak season statistics.
Do NOT calculate hypothetical outcomes or winners. Describe their comparative impacts, playstyles, and statistical profile.

### PLAYER 1: {p1.player_name} (Peak Season: {s1.season})
- Position: {p1.position}
- Points Per Game: {s1.points_per_game}
- Assists Per Game: {s1.assists_per_game}
- Rebounds Per Game: {s1.rebounds_per_game}
- Steals Per Game: {s1.steals_per_game}
- Blocks Per Game: {s1.blocks_per_game}
- True Shooting %: {s1.true_shooting_pct * 100:.1f}%
- Offensive Rating: {s1.offensive_rating}
- Defensive Rating: {s1.defensive_rating}

### PLAYER 2: {p2.player_name} (Peak Season: {s2.season})
- Position: {p2.position}
- Points Per Game: {s2.points_per_game}
- Assists Per Game: {s2.assists_per_game}
- Rebounds Per Game: {s2.rebounds_per_game}
- Steals Per Game: {s2.steals_per_game}
- Blocks Per Game: {s2.blocks_per_game}
- True Shooting %: {s2.true_shooting_pct * 100:.1f}%
- Offensive Rating: {s2.offensive_rating}
- Defensive Rating: {s2.defensive_rating}

Provide a comparative analysis on:
1. Offensive output and efficiency.
2. Defensive presence and impact.
3. Verdict on who provides more overall value.
Write in clean, professional markdown.
"""
                provider = get_llm_provider()
                answer = provider.generate_text(prompt)
                return Response({"answer": answer}, status=status.HTTP_200_OK)
            except Player.DoesNotExist:
                return Response({"error": "One or both players not found."}, status=status.HTTP_404_NOT_FOUND)

        # Scenario 2: Team Roster Upgrades
        if team_a_id and ("improve" in question.lower() or "upgrade" in question.lower() or "weakness" in question.lower()):
            try:
                CustomTeam.objects.get(id=team_a_id, user=request.user)
                result = get_ai_team_improvements(team_a_id)
                return Response({"answer": result['suggestions']}, status=status.HTTP_200_OK)
            except CustomTeam.DoesNotExist:
                return Response({"error": "Team not found or permission denied."}, status=status.HTTP_403_FORBIDDEN)

        # Scenario 3: Matchup Explanation
        if team_a_id and team_b_id:
            try:
                CustomTeam.objects.get(id=team_a_id, user=request.user)
                CustomTeam.objects.get(id=team_b_id, user=request.user)
                
                result = get_ai_matchup_explanation(team_a_id, team_b_id)
                return Response({"answer": result['explanation']}, status=status.HTTP_200_OK)
            except CustomTeam.DoesNotExist:
                return Response({"error": "One or both teams not found or permission denied."}, status=status.HTTP_403_FORBIDDEN)

        # Scenario 4: Era Analytics / Historical Questions
        if question and any(keyword in question.lower() for keyword in ["era", "jordan", "modern", "analytics", "showtime", "revolution", "evolution", "history", "trend", "scoring", "average", "dominate"]):
            from league_analytics.services import get_era_summaries, get_era_trends
            try:
                summaries = get_era_summaries()
                trends = get_era_trends()
                
                summaries_text = json.dumps(summaries, indent=2)
                
                prompt = f"""
You are an expert NBA Historian and Analytics Analyst. Use the following official Era Analytics data to answer the user's question about basketball eras and player evolution.
Do NOT hallucinate or make up averages. Base your analysis strictly on the facts and statistics below:

### ERA AVERAGES (PPG, ORTG, DRTG, TS%, USG%)
{summaries_text}

### LEAGUE TRENDS OVER TIME (Season-by-Season)
{json.dumps(trends[:30], indent=2)}

### USER QUESTION
"{question}"

Provide a detailed, professional, and engaging historical response answering the user's question, referencing the stats where appropriate.
Write in clean, professional markdown format.
"""
                provider = get_llm_provider()
                answer = provider.generate_text(prompt)
                return Response({"answer": answer}, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({"error": f"Failed to generate era response: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {"error": "Invalid request. Please provide either (team_a_id and team_b_id), (team_a_id and an improvement question), (player_a_id and player_b_id), or a historical era-related question."},
            status=status.HTTP_400_BAD_REQUEST
        )

from ml.prediction_service import predict_matchup_win_prob

class MLMatchupSimulationView(APIView):
    """
    API view to simulate a matchup between two saved custom teams using the ML model.
    Expects JSON body: {"team_a_id": <id>, "team_b_id": <id>}
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        team_a_id = request.data.get('team_a_id')
        team_b_id = request.data.get('team_b_id')
        
        if not team_a_id or not team_b_id:
            return Response(
                {"error": "Both 'team_a_id' and 'team_b_id' must be provided in the request body."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            team_a = CustomTeam.objects.get(id=team_a_id)
            team_b = CustomTeam.objects.get(id=team_b_id)
            
            result = predict_matchup_win_prob(team_a, team_b)
            return Response(result, status=status.HTTP_200_OK)
        except CustomTeam.DoesNotExist:
            return Response(
                {"error": "One or both teams do not exist."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

