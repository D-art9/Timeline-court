from django.urls import path
from .views import MatchupSimulationView, MatchupAIAnalystView, MLMatchupSimulationView

urlpatterns = [
    path('simulate/', MatchupSimulationView.as_view(), name='matchup-simulate'),
    path('ai/analyze/', MatchupAIAnalystView.as_view(), name='ai-analyst'),
    path('ml/simulate/', MLMatchupSimulationView.as_view(), name='ml-matchup-simulate'),
]
