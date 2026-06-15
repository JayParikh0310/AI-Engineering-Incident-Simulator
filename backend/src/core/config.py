"""
Application configuration settings.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str

    OPENROUTER_API_KEY: str = ""

    PRIMARY_MODEL: str = "qwen/qwen3-32b"
    FALLBACK_MODEL: str = "deepseek/deepseek-chat"

    DEBUG: bool = True
    APP_ENV: str = "development"
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
    )


settings = Settings()