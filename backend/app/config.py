from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent  # backend/
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
BACKUP_DIR = DATA_DIR / "backups"
BACKUP_DIR.mkdir(parents=True, exist_ok=True)


class Settings(BaseSettings):
    """Local-only configuration. Override via STUDYOS_* env vars or backend/.env."""

    model_config = SettingsConfigDict(env_prefix="STUDYOS_", env_file=".env", extra="ignore")

    app_name: str = "StudyOS"
    version: str = "0.1.0"
    host: str = "127.0.0.1"
    port: int = 8000
    database_url: str = f"sqlite:///{DATA_DIR / 'studyos.db'}"
    ollama_url: str = "http://127.0.0.1:11434"
    ollama_model: str = "qwen2.5:7b"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"


settings = Settings()
