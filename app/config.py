from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    sec_user_agent: str = "Your Name your.email@example.com"
    deepseek_api_key: str = "your-deepseek-api-key-here"
    database_url: str = "postgresql://rag_user:rag_pass@localhost:5432/rag_db"
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
