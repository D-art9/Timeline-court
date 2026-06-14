import os
import torch
from django.conf import settings
from .predictor import WinPredictor

class PyTorchModelLoader:
    _instance = None
    model = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
            cls._instance.load_model()
        return cls._instance

    def load_model(self):
        model_path = os.path.join(settings.BASE_DIR, 'ml', 'models', 'nba_win_predictor.pth')
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model weight file not found at {model_path}")
            
        self.model = WinPredictor()
        # map_location='cpu' ensures CPU safety
        state_dict = torch.load(model_path, map_location=torch.device('cpu'))
        self.model.load_state_dict(state_dict)
        self.model.eval()  # Set to evaluation mode (turns off dropout)

# Singleton loader instance
pytorch_loader = PyTorchModelLoader.get_instance()
