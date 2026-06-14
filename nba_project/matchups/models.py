from django.db import models
from django.contrib.auth.models import User
from players.models import CustomTeam

class SimulationHistory(models.Model):
    """
    Saves a record of a matchup simulation run by a user.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="simulations"
    )
    team_a = models.ForeignKey(
        CustomTeam,
        on_delete=models.CASCADE,
        related_name="simulations_as_team_a"
    )
    team_b = models.ForeignKey(
        CustomTeam,
        on_delete=models.CASCADE,
        related_name="simulations_as_team_b"
    )
    winner_name = models.CharField(max_length=100)
    win_probability = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username}: {self.team_a.name} vs {self.team_b.name} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"
