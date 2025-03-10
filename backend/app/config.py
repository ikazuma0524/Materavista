import os
from pathlib import Path
from pydantic import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """Application settings."""
    
    # API configuration
    API_PREFIX: str = "/api"
    DEBUG: bool = True
    
    # OpenAI API
    OPENAI_API_KEY: Optional[str] = os.environ.get("OPENAI_API_KEY")
    
    # LAMMPS configuration
    LAMMPS_SERVICE: Optional[str] = os.environ.get("LAMMPS_SERVICE")
    LAMMPS_VOLUME: Optional[str] = os.environ.get("LAMMPS_VOLUME", "/simulations")
    
    # Temporary directory for storing simulation files
    TEMP_DIR: Path = Path(os.environ.get("TEMP_DIR", "/tmp/lammps_simulations"))
    
    class Config:
        env_file = ".env"

# Create global settings object
settings = Settings()

# Create TEMP_DIR if it doesn't exist
settings.TEMP_DIR.mkdir(parents=True, exist_ok=True)
