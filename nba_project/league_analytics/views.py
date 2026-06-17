from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .services import (
    get_era_summaries,
    get_era_comparison,
    get_player_era_context,
    get_era_rankings,
    get_era_trends,
    get_basketball_news
)


class EraSummaryView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        try:
            data = get_era_summaries()
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class EraComparisonView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        era_a = request.query_params.get('era_a')
        era_b = request.query_params.get('era_b')
        if not era_a or not era_b:
            return Response(
                {"error": "Both 'era_a' and 'era_b' query parameters must be specified."},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            data = get_era_comparison(era_a, era_b)
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class EraRankingsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        era_name = request.query_params.get('era')
        try:
            data = get_era_rankings(era_name)
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class EraTrendsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        try:
            data = get_era_trends()
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class PlayerEraContextView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, player_id, *args, **kwargs):
        target_era = request.query_params.get('target_era')
        try:
            data = get_player_era_context(player_id, target_era_name=target_era)
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


from django.core.cache import cache

class NewsArticlesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        query = request.query_params.get('q') or 'basketball'
        cache_key = f"news_feed_{query.replace(' ', '_')}"
        
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data, status=status.HTTP_200_OK)

        try:
            data = get_basketball_news(query=query)
            cache.set(cache_key, data, timeout=7200) # cache for 2 hours
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)



