import os
import requests
from app.llm.base import LLMProvider
from app.config import settings

class DeepSeekProvider(LLMProvider):
    def __init__(self):
        self.api_key = settings.deepseek_api_key
        # Standard DeepSeek API endpoint
        self.url = "https://api.deepseek.com/chat/completions"

    def generate(self, prompt: str) -> str:
        if not self.api_key or self.api_key == os.getenv("DEEPSEEK_API_KEY", ""):
            return "DEEPSEEK_API_KEY is not configured in .env."
            
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "deepseek-chat",
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.0 # Deterministic answers for factual queries
        }
        
        response = requests.post(self.url, headers=headers, json=payload)
        response.raise_for_status()
        
        data = response.json()
        return data["choices"][0]["message"]["content"]
