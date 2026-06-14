from django.urls import path
from .views import (
    PlayerListView, 
    PlayerDetailView, 
    PlayerSearchView,
    CustomTeamListCreateView, 
    CustomTeamRetrieveDestroyView
)

urlpatterns = [
    path('', PlayerListView.as_view(), name='player-list'),
    path('<int:pk>/', PlayerDetailView.as_view(), name='player-detail'),
    path('search/', PlayerSearchView.as_view(), name='player-search'),
    path('teams/', CustomTeamListCreateView.as_view(), name='customteam-list-create'),
    path('teams/<int:pk>/', CustomTeamRetrieveDestroyView.as_view(), name='customteam-retrieve-destroy'),
]
