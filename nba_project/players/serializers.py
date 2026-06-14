from rest_framework import serializers
from .models import Player, PlayerSeasonStats, CustomTeam, TeamPlayer

class PlayerSeasonStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlayerSeasonStats
        fields = [
            'id', 'season', 'team_name', 'age', 'games', 'minutes_per_game',
            'points_per_game', 'rebounds_per_game', 'assists_per_game',
            'steals_per_game', 'blocks_per_game', 'turnovers_per_game',
            'fg_pct', 'three_pct', 'ft_pct', 'offensive_rating',
            'defensive_rating', 'net_rating', 'true_shooting_pct',
            'usage_rate', 'plus_minus', 'finals_appearances',
            'championships', 'era'
        ]

class PlayerSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='player_name')
    position = serializers.SerializerMethodField()
    jersey_number = serializers.SerializerMethodField()
    jerseyNumber = serializers.SerializerMethodField()
    era = serializers.SerializerMethodField()
    ppg = serializers.SerializerMethodField()
    rpg = serializers.SerializerMethodField()
    apg = serializers.SerializerMethodField()
    ts = serializers.SerializerMethodField()
    netRating = serializers.SerializerMethodField()
    teamColor = serializers.SerializerMethodField()
    avatarUrl = serializers.SerializerMethodField()

    class Meta:
        model = Player
        fields = [
            'id', 'player_id', 'name', 'position', 'height', 'weight', 'birth_date',
            'jersey_number', 'jerseyNumber', 'era', 'ppg', 'rpg', 'apg', 'ts', 'netRating', 'teamColor', 'avatarUrl'
        ]

    def _get_peak_season(self, obj):
        if not hasattr(obj, '_peak_season_cache'):
            obj._peak_season_cache = obj.seasons.order_by('-points_per_game').first()
        return obj._peak_season_cache

    def get_position(self, obj):
        db_pos = obj.position
        peak = self._get_peak_season(obj)
        apg = peak.assists_per_game if peak else 0.0
        rpg = peak.rebounds_per_game if peak else 0.0

        if db_pos == 'Center':
            return 'C'
        elif db_pos in ['Center-Forward', 'Forward-Center']:
            return 'C' if rpg > 9.0 else 'PF'
        elif db_pos == 'Forward':
            return 'PF' if rpg > 7.0 else 'SF'
        elif db_pos in ['Guard-Forward', 'Forward-Guard']:
            return 'SF' if rpg > 5.0 else 'SG'
        elif db_pos == 'Guard':
            return 'PG' if apg > 5.0 else 'SG'
        return 'SG'


    def get_jersey_number(self, obj):
        return (obj.player_id % 98) + 1

    def get_jerseyNumber(self, obj):
        return self.get_jersey_number(obj)

    def get_era(self, obj):
        peak = self._get_peak_season(obj)
        return peak.era if peak else 'Modern'

    def get_ppg(self, obj):
        peak = self._get_peak_season(obj)
        return peak.points_per_game if peak else 0.0

    def get_rpg(self, obj):
        peak = self._get_peak_season(obj)
        return peak.rebounds_per_game if peak else 0.0

    def get_apg(self, obj):
        peak = self._get_peak_season(obj)
        return peak.assists_per_game if peak else 0.0

    def get_ts(self, obj):
        peak = self._get_peak_season(obj)
        return round(peak.true_shooting_pct * 100, 2) if peak else 0.0

    def get_netRating(self, obj):
        peak = self._get_peak_season(obj)
        return peak.net_rating if peak else 0.0

    def get_teamColor(self, obj):
        peak = self._get_peak_season(obj)
        if not peak:
            return '#8B5CF6'
        team = peak.team_name.lower()
        if 'bulls' in team:
            return '#CE1141'
        elif 'warriors' in team:
            return '#1D428A'
        elif 'lakers' in team:
            return '#FDB927'
        elif 'celtics' in team:
            return '#007A33'
        elif 'heat' in team:
            return '#98002E'
        elif 'spurs' in team:
            return '#C4CED4'
        elif 'rockets' in team:
            return '#CE1141'
        elif 'nets' in team:
            return '#000000'
        elif 'knicks' in team:
            return '#F58426'
        elif 'mavericks' in team:
            return '#00538C'
        return '#8B5CF6'

    def get_avatarUrl(self, obj):
        return f"https://cdn.nba.com/headshots/nba/latest/1040x760/{obj.player_id}.png"



class PlayerDetailSerializer(serializers.ModelSerializer):
    # 'seasons' is the related_name defined on the ForeignKey in PlayerSeasonStats model
    seasons = PlayerSeasonStatsSerializer(many=True, read_only=True)

    class Meta:
        model = Player
        fields = ['id', 'player_id', 'player_name', 'position', 'height', 'weight', 'birth_date', 'seasons']


class TeamPlayerDetailSerializer(serializers.ModelSerializer):
    player = PlayerSerializer(read_only=True)

    class Meta:
        model = TeamPlayer
        fields = ['player', 'lineup_position']


class TeamPlayerCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeamPlayer
        fields = ['player', 'lineup_position']


class CustomTeamSerializer(serializers.ModelSerializer):
    team_players_details = TeamPlayerDetailSerializer(
        source='team_players', 
        many=True, 
        read_only=True
    )
    team_players = TeamPlayerCreateSerializer(
        many=True, 
        write_only=True
    )

    class Meta:
        model = CustomTeam
        fields = ['id', 'name', 'created_at', 'team_players_details', 'team_players']
        read_only_fields = ['id', 'created_at']

    def validate_team_players(self, value):
        if len(value) != 5:
            raise serializers.ValidationError("A custom team must have exactly 5 players.")

        positions = []
        player_ids = []

        for item in value:
            pos = item['lineup_position']
            player_id = item['player'].id

            positions.append(pos)
            player_ids.append(player_id)

        if len(set(positions)) != 5:
            raise serializers.ValidationError(
                "Each player must be assigned to a unique lineup position (PG, SG, SF, PF, C)."
            )

        if len(set(player_ids)) != 5:
            raise serializers.ValidationError("A player cannot be added to the team multiple times.")

        return value

    def create(self, validated_data):
        players_data = validated_data.pop('team_players')
        team = CustomTeam.objects.create(**validated_data)
        for player_data in players_data:
            TeamPlayer.objects.create(team=team, **player_data)
        return team
