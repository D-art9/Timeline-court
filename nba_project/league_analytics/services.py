from django.db.models import Avg, Max, F, StdDev
from players.models import Player, PlayerSeasonStats
import requests
from django.conf import settings


def get_era_summaries():
    """
    Returns statistical summaries for all eras present in the database,
    along with mapped historical standard decadal eras.
    """
    # Query database eras first
    eras = PlayerSeasonStats.objects.values('era').annotate(
        avg_ppg=Avg('points_per_game'),
        avg_ortg=Avg('offensive_rating'),
        avg_drtg=Avg('defensive_rating'),
        avg_ts_pct=Avg('true_shooting_pct'),
        avg_usage_rate=Avg('usage_rate'),
        avg_plus_minus=Avg('plus_minus')
    ).order_by('era')
    
    summaries = {}
    for era in eras:
        name = era['era']
        summaries[name] = {
            'avg_ppg': round(era['avg_ppg'] or 0.0, 2),
            'avg_ortg': round(era['avg_ortg'] or 0.0, 2),
            'avg_drtg': round(era['avg_drtg'] or 0.0, 2),
            'avg_ts_pct': round((era['avg_ts_pct'] or 0.0) * 100, 2),
            'avg_usage_rate_pct': round((era['avg_usage_rate'] or 0.0) * 100, 2),
            'avg_plus_minus': round(era['avg_plus_minus'] or 0.0, 2),
            'pace': 100.0 if 'Three' in name else (92.0 if 'Early' in name else 102.0),
            'ppg': round(era['avg_ppg'] or 0.0, 2),
            'ts': round((era['avg_ts_pct'] or 0.0) * 100, 2),
        }
        
    # Standard Decadal Eras Mappings/Fallbacks
    standard_eras = {
        '1960s': {'pace': 115.0, 'ppg': 110.0, 'ts': 48.5},
        '1970s': {'pace': 108.0, 'ppg': 105.0, 'ts': 51.2},
        '1980s': {'pace': 102.0, 'ppg': 110.0, 'ts': 53.1},
        '1990s': {'pace': 90.0, 'ppg': 95.6, 'ts': 54.2},
        '2000s': {'pace': 90.5, 'ppg': 97.2, 'ts': 54.5},
        'Modern': {'pace': 100.0, 'ppg': 114.2, 'ts': 58.5},
    }
    
    # Fill in standard eras with database-guided averages where possible, otherwise fallbacks
    for name, defaults in standard_eras.items():
        db_match = None
        if name == '1980s':
            db_match = summaries.get('Pace Transition Era')
        elif name in ['1990s', '2000s']:
            db_match = summaries.get('Early Modern Era')
        elif name == 'Modern':
            db_match = summaries.get('Three Point Era')
            
        if db_match:
            summaries[name] = {
                'avg_ppg': db_match['avg_ppg'],
                'avg_ortg': db_match['avg_ortg'],
                'avg_drtg': db_match['avg_drtg'],
                'avg_ts_pct': db_match['avg_ts_pct'],
                'avg_usage_rate_pct': db_match['avg_usage_rate_pct'],
                'avg_plus_minus': db_match['avg_plus_minus'],
                'pace': defaults['pace'],
                'ppg': db_match['avg_ppg'],
                'ts': db_match['avg_ts_pct'],
            }
        else:
            summaries[name] = {
                'avg_ppg': defaults['ppg'],
                'avg_ortg': 105.0,
                'avg_drtg': 105.0,
                'avg_ts_pct': defaults['ts'],
                'avg_usage_rate_pct': 20.0,
                'avg_plus_minus': 0.0,
                'pace': defaults['pace'],
                'ppg': defaults['ppg'],
                'ts': defaults['ts'],
            }
            
    return summaries

def get_era_comparison(era_a, era_b):
    """
    Compares two eras and calculates direct differences.
    """
    summaries = get_era_summaries()
    if era_a not in summaries or era_b not in summaries:
        raise ValueError("One or both specified eras do not exist in the database.")
        
    stats_a = summaries[era_a]
    stats_b = summaries[era_b]
    
    comparison = {}
    for key in stats_a.keys():
        diff = round(stats_a[key] - stats_b[key], 2)
        comparison[key] = {
            'era_a': stats_a[key],
            'era_b': stats_b[key],
            'diff': diff,
            'advantage': era_a if diff > 0 else (era_b if diff < 0 else 'Even')
        }
    return {
        'era_a_name': era_a,
        'era_b_name': era_b,
        'comparison': comparison
    }

def get_player_era_context(player_id, target_era_name=None):
    """
    Calculates a player's stats relative to their era's average stats.
    Optionally projects stats into a target era using Z-score normalization.
    """
    try:
        player = Player.objects.get(id=player_id)
    except Player.DoesNotExist:
        raise ValueError("Player not found.")
        
    peak_stats = player.seasons.order_by('-points_per_game').first()
    if not peak_stats:
        return {}
        
    era_name = peak_stats.era
    
    # Calculate averages and standard deviations for original era
    orig_avgs = PlayerSeasonStats.objects.filter(era=era_name).aggregate(
        avg_ppg=Avg('points_per_game'),
        std_ppg=StdDev('points_per_game'),
        avg_apg=Avg('assists_per_game'),
        std_apg=StdDev('assists_per_game'),
        avg_rpg=Avg('rebounds_per_game'),
        std_rpg=StdDev('rebounds_per_game'),
        avg_ts_pct=Avg('true_shooting_pct'),
        avg_usage_rate=Avg('usage_rate')
    )
    
    player_ppg = peak_stats.points_per_game
    player_apg = peak_stats.assists_per_game
    player_rpg = peak_stats.rebounds_per_game
    player_ts = peak_stats.true_shooting_pct
    player_usage = peak_stats.usage_rate
    
    era_ppg = orig_avgs['avg_ppg'] or 1.0
    era_ts = orig_avgs['avg_ts_pct'] or 1.0
    era_usage = orig_avgs['avg_usage_rate'] or 1.0
    
    relative_scoring = round(player_ppg / era_ppg, 2)
    relative_efficiency = round(player_ts / era_ts, 2)
    relative_usage = round(player_usage / era_usage, 2)
    
    ppg_diff = round(player_ppg - era_ppg, 2)
    ts_diff = round((player_ts - era_ts) * 100, 2)
    scale_rating = round(relative_scoring * 100, 1)

    result = {
        'player_name': player.player_name,
        'peak_season': peak_stats.season,
        'era_name': era_name,
        'ppg_diff': ppg_diff,
        'ts_diff': ts_diff,
        'scale_rating': scale_rating,
        'scale rating': scale_rating,
        'player_stats': {
            'ppg': player_ppg,
            'apg': player_apg,
            'rpg': player_rpg,
            'ts_pct': round(player_ts * 100, 2),
            'usage_rate_pct': round(player_usage * 100, 2)
        },
        'era_averages': {
            'ppg': round(era_ppg, 2),
            'ts_pct': round(era_ts * 100, 2),
            'usage_rate_pct': round(era_usage * 100, 2)
        },
        'relative_metrics': {
            'relative_scoring_index': relative_scoring,
            'relative_efficiency_index': relative_efficiency,
            'relative_usage_index': relative_usage
        }
    }

    # Add dynamic cross-era Z-score projection if target_era_name is provided
    if target_era_name:
        db_target_era = target_era_name
        if target_era_name == '1980s':
            db_target_era = 'Pace Transition Era'
        elif target_era_name in ['1990s', '2000s']:
            db_target_era = 'Early Modern Era'
        elif target_era_name == 'Modern':
            db_target_era = 'Three Point Era'
            
        target_avgs = PlayerSeasonStats.objects.filter(era=db_target_era).aggregate(
            avg_ppg=Avg('points_per_game'),
            std_ppg=StdDev('points_per_game'),
            avg_apg=Avg('assists_per_game'),
            std_apg=StdDev('assists_per_game'),
            avg_rpg=Avg('rebounds_per_game'),
            std_rpg=StdDev('rebounds_per_game')
        )
        
        if target_avgs['avg_ppg'] is not None:
            # Helper to calculate Z-scores and project
            def project_metric(player_val, orig_avg, orig_std, target_avg, target_std, min_val=0.0):
                # Standard deviation fallbacks if zero or None
                o_std = orig_std or 1.0
                t_std = target_std or 1.0
                o_avg = orig_avg or 1.0
                t_avg = target_avg or 1.0
                
                # Z-score normalization
                z_score = (player_val - o_avg) / o_std
                # Translate to target
                projected = t_avg + (z_score * t_std)
                return round(max(projected, min_val), 1), round(z_score, 2)
                
            proj_ppg, z_ppg = project_metric(player_ppg, orig_avgs['avg_ppg'], orig_avgs['std_ppg'], target_avgs['avg_ppg'], target_avgs['std_ppg'])
            proj_apg, z_apg = project_metric(player_apg, orig_avgs['avg_apg'], orig_avgs['std_apg'], target_avgs['avg_apg'], target_avgs['std_apg'])
            proj_rpg, z_rpg = project_metric(player_rpg, orig_avgs['avg_rpg'], orig_avgs['std_rpg'], target_avgs['avg_rpg'], target_avgs['std_rpg'])
            
            result['projection'] = {
                'target_era': target_era_name,
                'projected_ppg': proj_ppg,
                'projected_apg': proj_apg,
                'projected_rpg': proj_rpg,
                'z_scores': {
                    'ppg': z_ppg,
                    'apg': z_apg,
                    'rpg': z_rpg
                }
            }
            
    return result


def get_era_rankings(era_name=None):
    """
    Generates leaderboard rankings for various metrics within an era.
    Supports standard year mappings.
    """
    queryset = PlayerSeasonStats.objects.all()
    if era_name:
        db_era = era_name
        if era_name == '1980s':
            db_era = 'Pace Transition Era'
        elif era_name in ['1990s', '2000s']:
            db_era = 'Early Modern Era'
        elif era_name == 'Modern':
            db_era = 'Three Point Era'
        queryset = queryset.filter(era=db_era)
        
    # Top Scorers
    scorers = queryset.order_by('-points_per_game')[:5]
    scorers_list = [{
        'player_name': s.player.player_name,
        'season': s.season,
        'value': s.points_per_game
    } for s in scorers]
    
    # Top Shooters (True Shooting %)
    shooters = queryset.order_by('-true_shooting_pct')[:5]
    shooters_list = [{
        'player_name': s.player.player_name,
        'season': s.season,
        'value': round(s.true_shooting_pct * 100, 2)
    } for s in shooters]
    
    # Top Playmakers (Assists)
    playmakers = queryset.order_by('-assists_per_game')[:5]
    playmakers_list = [{
        'player_name': s.player.player_name,
        'season': s.season,
        'value': s.assists_per_game
    } for s in playmakers]
    
    # Top Defenders
    defenders = queryset.order_by('defensive_rating')[:5]
    defenders_list = [{
        'player_name': d.player.player_name,
        'season': d.season,
        'value': d.defensive_rating
    } for d in defenders]
    
    return {
        'era_filter': era_name or 'All Eras',
        'rankings': {
            'best_scorers': scorers_list,
            'best_shooters_pct': shooters_list,
            'best_playmakers': playmakers_list,
            'best_defenders_rating': defenders_list
        }
    }

def get_era_trends():
    """
    Compiles league progression averages grouped chronologically by season.
    """
    seasons = PlayerSeasonStats.objects.values('season').annotate(
        avg_ppg=Avg('points_per_game'),
        avg_ortg=Avg('offensive_rating'),
        avg_drtg=Avg('defensive_rating'),
        avg_ts_pct=Avg('true_shooting_pct'),
        avg_usage_rate=Avg('usage_rate')
    ).order_by('season')
    
    trends = []
    for s in seasons:
        # Determine year from season (e.g., "1995-96" -> 1995)
        season_str = s['season']
        try:
            year = int(season_str.split('-')[0])
        except (ValueError, IndexError):
            year = 2000
            
        # Determine pace dynamically
        if year < 1990:
            pace = round(102.0 - (1990 - year) * 0.2, 1)
        elif year < 2000:
            pace = round(90.0 + (year - 1990) * 0.1, 1)
        elif year < 2010:
            pace = round(90.5 + (year - 2000) * 0.2, 1)
        else:
            pace = round(95.0 + (year - 2010) * 0.3, 1)
            if pace > 100.0:
                pace = 100.0

        trends.append({
            'season': season_str,
            'year': year,
            'pace': pace,
            'ppg': round(s['avg_ppg'] or 0.0, 2),
            'ts': round((s['avg_ts_pct'] or 0.0) * 100, 2),
            'avg_ppg': round(s['avg_ppg'] or 0.0, 2),
            'avg_ortg': round(s['avg_ortg'] or 0.0, 2),
            'avg_drtg': round(s['avg_drtg'] or 0.0, 2),
            'avg_ts_pct': round((s['avg_ts_pct'] or 0.0) * 100, 2),
            'avg_usage_rate_pct': round((s['avg_usage_rate'] or 0.0) * 100, 2)
        })
    return trends


def get_basketball_news(query=None):
    """
    Fetches the latest basketball news using News API.
    If News API key is missing, rate-limited, or fails, falls back to mock basketball news articles.
    """
    api_key = getattr(settings, 'NEWS_API_KEY', '')
    search_query = query if query else 'basketball OR NBA'
    
    # Pre-configure beautiful mock fallback articles for resilient design
    mock_articles = [
        {
            "title": "Championship Chase: Inside the Intense Battle for the Larry O'Brien Trophy",
            "description": "As the playoffs heat up, we break down the key matchups, tactical adjustments, and superstar performances defining this year's championship run.",
            "url": "https://nba.com",
            "image_url": "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=60",
            "source": "Hoops Network",
            "published_at": "2026-06-14T21:00:00Z"
        },
        {
            "title": "Rise of the Positionless Player: How Modern Analytics Reshaped the Court",
            "description": "Exploring how standard guard and big roles have merged into multi-talented wing structures, leading to the most dynamic offense era in league history.",
            "url": "https://nba.com",
            "image_url": "https://images.unsplash.com/photo-1505666287802-931dc83948e9?w=800&auto=format&fit=crop&q=60",
            "source": "Timeline Court Daily",
            "published_at": "2026-06-14T18:30:00Z"
        },
        {
            "title": "Rookie Rankings: Which First-Year Players Are Making the Biggest Impact?",
            "description": "An in-depth look at this year's draft class, highlighting players who are immediately contributing to winning basketball and showing franchise cornerstone potential.",
            "url": "https://nba.com",
            "image_url": "https://images.unsplash.com/photo-1519766304817-4f37bda74a27?w=800&auto=format&fit=crop&q=60",
            "source": "Draft Central",
            "published_at": "2026-06-14T15:45:00Z"
        },
        {
            "title": "Off-Season Trade Rumors: Blockbuster Deals Already Cooking Behind the Scenes",
            "description": "Front offices are already scheming for the summer. Insiders report multiple multi-team trades are currently being discussed to reshape the league's balance of power.",
            "url": "https://nba.com",
            "image_url": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=60",
            "source": "Inside Hoops",
            "published_at": "2026-06-14T12:15:00Z"
        }
    ]

    if not api_key:
        return mock_articles

    url = "https://newsapi.org/v2/everything"
    params = {
        "q": search_query,
        "sortBy": "publishedAt",
        "language": "en",
        "pageSize": 15,
        "apiKey": api_key
    }
    
    try:
        response = requests.get(url, params=params, timeout=5)
        if response.status_code == 200:
            data = response.json()
            articles = data.get("articles", [])
            
            parsed_articles = []
            for art in articles:
                title = art.get("title")
                if not title or "[Removed]" in title or "removed" in title.lower():
                    continue
                    
                parsed_articles.append({
                    "title": title,
                    "description": art.get("description") or "",
                    "url": art.get("url") or "",
                    "image_url": art.get("urlToImage") or "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=60",
                    "source": art.get("source", {}).get("name") or "News",
                    "published_at": art.get("publishedAt") or ""
                })
            
            return parsed_articles if parsed_articles else mock_articles
        else:
            return mock_articles
    except Exception:
        return mock_articles


