import os
import csv
from datetime import datetime
from django.core.management.base import BaseCommand
from players.models import Player, PlayerSeasonStats

class Command(BaseCommand):
    help = 'Load NBA player, team, and shot data from CSV files'

    def handle(self, *args, **options):
        csv_file_path = os.path.join('data', 'nba_player_dataset.csv')
        if not os.path.exists(csv_file_path):
            self.stdout.write(self.style.ERROR(f'File {csv_file_path} does not exist.'))
            return

        self.stdout.write('Starting data import from CSV...')

        def parse_height(height_str):
            if not height_str:
                return None
            try:
                parts = height_str.split('-')
                if len(parts) == 2:
                    return float(parts[0]) * 12 + float(parts[1])
                return float(height_str)
            except ValueError:
                return None

        def parse_float(val):
            try:
                return float(val) if val else 0.0
            except ValueError:
                return 0.0

        def parse_int(val):
            try:
                return int(float(val)) if val else 0
            except ValueError:
                return 0

        def parse_date(date_str):
            if not date_str:
                return None
            try:
                return datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return None

        # Clean existing records to avoid duplication
        PlayerSeasonStats.objects.all().delete()
        Player.objects.all().delete()

        created_players_count = 0
        created_stats_count = 0

        with open(csv_file_path, mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                player_id = int(row['player_id'])
                
                # Retrieve or create Player
                player, created = Player.objects.get_or_create(
                    player_id=player_id,
                    defaults={
                        'player_name': row['player_name'],
                        'position': row['position'],
                        'height': parse_height(row['height']),
                        'weight': parse_float(row['weight']),
                        'birth_date': parse_date(row['birth_date']),
                    }
                )
                if created:
                    created_players_count += 1

                # Create PlayerSeasonStats
                PlayerSeasonStats.objects.create(
                    player=player,
                    season=row['season'],
                    team_name=row['team_name'],
                    age=parse_int(row['age']),
                    games=parse_int(row['games']),
                    minutes_per_game=parse_float(row['minutes_per_game']),
                    points_per_game=parse_float(row['points_per_game']),
                    rebounds_per_game=parse_float(row['rebounds_per_game']),
                    assists_per_game=parse_float(row['assists_per_game']),
                    steals_per_game=parse_float(row['steals_per_game']),
                    blocks_per_game=parse_float(row['blocks_per_game']),
                    turnovers_per_game=parse_float(row['turnovers_per_game']),
                    fg_pct=parse_float(row['fg_pct']),
                    three_pct=parse_float(row['three_pct']),
                    ft_pct=parse_float(row['ft_pct']),
                    offensive_rating=parse_float(row['offensive_rating']),
                    defensive_rating=parse_float(row['defensive_rating']),
                    net_rating=parse_float(row['net_rating']),
                    true_shooting_pct=parse_float(row['true_shooting_pct']),
                    usage_rate=parse_float(row['usage_rate']),
                    plus_minus=parse_float(row['plus_minus']),
                    finals_appearances=parse_int(row['finals_appearances']),
                    championships=parse_int(row['championships']),
                    era=row['era'],
                )
                created_stats_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'Import completed: Created {created_players_count} players and {created_stats_count} season records.'
        ))
