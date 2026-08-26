from abc import ABC, abstractmethod

class LLMProvider(ABC):
    """
    Abstract interface for LLM providers.
    Allows easy swapping between DeepSeek, OpenAI, Anthropic, etc.
    """
    @abstractmethod
    def generate(self, prompt: str) -> str:
        """Generate a response given a prompt."""
        pass
