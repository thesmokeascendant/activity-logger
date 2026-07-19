from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "Activity Logger"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/activity_logger.db"
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://frontend:3000"]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
