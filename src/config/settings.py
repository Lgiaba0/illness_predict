from __future__ import annotations

import os
from dataclasses import dataclass, field


def _parse_csv_env(env_name: str, default: str) -> list[str]:
    raw_value = os.getenv(env_name, default)
    return [item.strip() for item in raw_value.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    default_allele_frequency: float = float(os.getenv("ALLELE_FREQUENCY_DEFAULT", "0.01"))
    max_individuals_exact: int = int(os.getenv("MAX_INDIVIDUALS_EXACT", "18"))
    cors_allow_origins: list[str] = field(
        default_factory=lambda: _parse_csv_env("CORS_ALLOW_ORIGINS", "*")
    )


settings = Settings()
