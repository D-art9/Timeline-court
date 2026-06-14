import requests
import json
from django.conf import settings

class BaseLLMProvider:
    def generate_text(self, prompt: str) -> str:
        raise NotImplementedError("Each provider must implement generate_text.")

class GeminiProvider(BaseLLMProvider):
    def generate_text(self, prompt: str) -> str:
        api_key = getattr(settings, 'GEMINI_API_KEY', '')
        if not api_key:
            return "Error: GEMINI_API_KEY is not configured in settings."
            
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        headers = {'Content-Type': 'application/json'}
        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ]
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload)
            if response.status_code == 200:
                data = response.json()
                return data['candidates'][0]['content']['parts'][0]['text']
            return f"Gemini API Error (Status {response.status_code}): {response.text}"
        except Exception as e:
            return f"Gemini connection failure: {str(e)}"

class OpenAIProvider(BaseLLMProvider):
    def generate_text(self, prompt: str) -> str:
        api_key = getattr(settings, 'OPENAI_API_KEY', '')
        if not api_key:
            return "Error: OPENAI_API_KEY is not configured."
            
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
        payload = {
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": prompt}]
        }
        try:
            response = requests.post(url, headers=headers, json=payload)
            if response.status_code == 200:
                return response.json()['choices'][0]['message']['content']
            return f"OpenAI Error: {response.text}"
        except Exception as e:
            return f"OpenAI connection error: {str(e)}"

class ClaudeProvider(BaseLLMProvider):
    def generate_text(self, prompt: str) -> str:
        api_key = getattr(settings, 'CLAUDE_API_KEY', '')
        if not api_key:
            return "Error: CLAUDE_API_KEY is not configured."
            
        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "content-type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01"
        }
        payload = {
            "model": "claude-3-5-haiku-20241022",
            "max_tokens": 1024,
            "messages": [{"role": "user", "content": prompt}]
        }
        try:
            response = requests.post(url, headers=headers, json=payload)
            if response.status_code == 200:
                return response.json()['content'][0]['text']
            return f"Claude Error: {response.text}"
        except Exception as e:
            return f"Claude connection error: {str(e)}"

def get_llm_provider() -> BaseLLMProvider:
    provider = getattr(settings, 'AI_PROVIDER', 'gemini').lower()
    if provider == 'gemini':
        return GeminiProvider()
    elif provider == 'openai':
        return OpenAIProvider()
    elif provider == 'claude':
        return ClaudeProvider()
    raise ValueError(f"Unknown AI Provider: {provider}")
