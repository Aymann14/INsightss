from app.llm.base import LLMProvider
from app.llm.deepseek import DeepSeekProvider

def get_llm_provider() -> LLMProvider:
    """
    Factory function to get the current LLM provider.
    Change this to return an OpenAIProvider or AnthropicProvider 
    if you want to swap the model out later.
    """
    return DeepSeekProvider()
