from django.db import models
from django.contrib.auth.models import User


class Player(models.Model):
    player_id = models.IntegerField(unique=True)

    player_name = models.CharField(max_length=100)

    position = models.CharField(max_length=20)

    height = models.FloatField(null=True, blank=True)
    weight = models.FloatField(null=True, blank=True)

    birth_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return self.player_name


class PlayerSeasonStats(models.Model):
    player = models.ForeignKey(
        Player,
        on_delete=models.CASCADE,
        related_name="seasons"
    )

    season = models.CharField(max_length=20)

    team_name = models.CharField(max_length=100)

    age = models.IntegerField()

    games = models.IntegerField()

    minutes_per_game = models.FloatField()

    points_per_game = models.FloatField()

    rebounds_per_game = models.FloatField()

    assists_per_game = models.FloatField()

    steals_per_game = models.FloatField()

    blocks_per_game = models.FloatField()

    turnovers_per_game = models.FloatField()

    fg_pct = models.FloatField()

    three_pct = models.FloatField()

    ft_pct = models.FloatField()

    offensive_rating = models.FloatField()

    defensive_rating = models.FloatField()

    net_rating = models.FloatField()

    true_shooting_pct = models.FloatField()

    usage_rate = models.FloatField()

    plus_minus = models.FloatField()

    finals_appearances = models.IntegerField()

    championships = models.IntegerField()

    era = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.player.player_name} - {self.season}"


class CustomTeam(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="custom_teams",
        null=True,
        blank=True
    )
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    players = models.ManyToManyField(
        Player,
        through='TeamPlayer',
        related_name='custom_teams'
    )

    def __str__(self):
        return self.name


class TeamPlayer(models.Model):
    POSITION_CHOICES = [
        ('PG', 'Point Guard'),
        ('SG', 'Shooting Guard'),
        ('SF', 'Small Forward'),
        ('PF', 'Power Forward'),
        ('C', 'Center'),
    ]

    team = models.ForeignKey(
        CustomTeam,
        on_delete=models.CASCADE,
        related_name="team_players"
    )
    player = models.ForeignKey(
        Player,
        on_delete=models.CASCADE,
        related_name="team_memberships"
    )
    lineup_position = models.CharField(
        max_length=5,
        choices=POSITION_CHOICES
    )

    class Meta:
        unique_together = ('team', 'lineup_position')

    def __str__(self):
        return f"{self.team.name} - {self.lineup_position}: {self.player.player_name}"