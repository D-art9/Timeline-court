from rest_framework import generics, permissions
from .models import Player, CustomTeam
from .serializers import PlayerSerializer, PlayerDetailSerializer, CustomTeamSerializer

class PlayerListView(generics.ListAPIView):
    """
    API view to retrieve a list of all players.
    """
    queryset = Player.objects.all().order_by('player_name')
    serializer_class = PlayerSerializer

class PlayerDetailView(generics.RetrieveAPIView):
    """
    API view to retrieve detailed information for a single player,
    including all of their season stats.
    """
    queryset = Player.objects.all()
    serializer_class = PlayerDetailSerializer

class PlayerSearchView(generics.ListAPIView):
    """
    API view to search for players by name (case-insensitive).
    """
    serializer_class = PlayerSerializer

    def get_queryset(self):
        query = self.request.query_params.get('q', '')
        if query:
            return Player.objects.filter(player_name__icontains=query).order_by('player_name')
        return Player.objects.none()

class CustomTeamListCreateView(generics.ListCreateAPIView):
    """
    API view to list saved custom teams or create a new 5-player team.
    """
    serializer_class = CustomTeamSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CustomTeam.objects.filter(user=self.request.user).prefetch_related('team_players__player').order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class CustomTeamRetrieveDestroyView(generics.RetrieveDestroyAPIView):
    """
    API view to retrieve detailed view of a saved team or delete it.
    """
    serializer_class = CustomTeamSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CustomTeam.objects.filter(user=self.request.user).prefetch_related('team_players__player')

