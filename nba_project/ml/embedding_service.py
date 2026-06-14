import os
import csv
from django.conf import settings

class EmbeddingLookupService:
    _instance = None
    embeddings = {}

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
            cls._instance.load_embeddings()
        return cls._instance

    def load_embeddings(self):
        csv_path = os.path.join(settings.BASE_DIR, 'ml', 'legend_embeddings.csv')
        if not os.path.exists(csv_path):
            raise FileNotFoundError(f"Embeddings CSV file not found at {csv_path}")
            
        with open(csv_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                name = row['player_name'].strip().lower()
                embedding = [
                    float(row['embed_1']),
                    float(row['embed_2']),
                    float(row['embed_3']),
                    float(row['embed_4']),
                    float(row['embed_5']),
                    float(row['embed_6'])
                ]
                self.embeddings[name] = embedding

    def get_player_embedding(self, player_name):
        name_key = player_name.strip().lower()
        # Fallback: if player is not found, return 6D zero vector
        return self.embeddings.get(name_key, [0.0] * 6)

# Singleton service instance
embedding_service = EmbeddingLookupService.get_instance()
