from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    default_allele_frequency: float = float(os.getenv("ALLELE_FREQUENCY_DEFAULT", "0.01"))
    max_individuals_exact: int = int(os.getenv("MAX_INDIVIDUALS_EXACT", "18"))


settings = Settings()
