from rest_framework import serializers
from .models import SimulationHistory

class SimulationHistorySerializer(serializers.ModelSerializer):
    team_a_name = serializers.CharField(source='team_a.name', read_only=True)
    team_b_name = serializers.CharField(source='team_b.name', read_only=True)

    class Meta:
        model = SimulationHistory
        fields = ['id', 'team_a', 'team_a_name', 'team_b', 'team_b_name', 'winner_name', 'win_probability', 'created_at']
