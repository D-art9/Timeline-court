from django.urls import path
from .views import (
    EraSummaryView,
    EraComparisonView,
    EraRankingsView,
    EraTrendsView,
    PlayerEraContextView,
    NewsArticlesView
)

urlpatterns = [
    path('eras/', EraSummaryView.as_view(), name='era-summaries'),
    path('eras/compare/', EraComparisonView.as_view(), name='era-comparison'),
    path('eras/rankings/', EraRankingsView.as_view(), name='era-rankings'),
    path('eras/trends/', EraTrendsView.as_view(), name='era-trends'),
    path('players/<int:player_id>/era-context/', PlayerEraContextView.as_view(), name='player-era-context'),
    path('news/', NewsArticlesView.as_view(), name='nba-news'),
]

