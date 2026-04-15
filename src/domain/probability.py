from __future__ import annotations

from collections.abc import Mapping
from typing import Literal

from src.domain.models import Phenotype

GENOTYPES = ("AA", "Aa", "aa")
InheritanceMode = Literal["recessive", "dominant"]


def uniform_prior(genotype: str) -> float:
    """Uniform prior: P(AA) = P(Aa) = P(aa) = 1/3 (mendelian without population frequency)."""
    return 1.0 / 3.0


def founder_prior(genotype: str, allele_frequency: float | None) -> float:
    if allele_frequency is None:
        return uniform_prior(genotype)
    q = allele_frequency
    p = 1.0 - q
    if genotype == "AA":
        return p * p
    if genotype == "Aa":
        return 2.0 * p * q
    if genotype == "aa":
        return q * q
    raise ValueError(f"Unsupported genotype '{genotype}'")


def _gamete_prob(parent_genotype: str, allele: str) -> float:
    if parent_genotype == "AA":
        return 1.0 if allele == "A" else 0.0
    if parent_genotype == "Aa":
        return 0.5
    if parent_genotype == "aa":
        return 1.0 if allele == "a" else 0.0
    raise ValueError(f"Unsupported parent genotype '{parent_genotype}'")


def mendel_prob(parent1: str, parent2: str, child: str) -> float:
    if child == "AA":
        return _gamete_prob(parent1, "A") * _gamete_prob(parent2, "A")
    if child == "aa":
        return _gamete_prob(parent1, "a") * _gamete_prob(parent2, "a")
    if child == "Aa":
        return (
            _gamete_prob(parent1, "A") * _gamete_prob(parent2, "a")
            + _gamete_prob(parent1, "a") * _gamete_prob(parent2, "A")
        )
    raise ValueError(f"Unsupported child genotype '{child}'")


def affected_genotypes(mode: InheritanceMode) -> tuple[str, ...]:
    if mode == "recessive":
        return ("aa",)
    return ("AA", "Aa")


def unaffected_genotypes(mode: InheritanceMode) -> tuple[str, ...]:
    if mode == "recessive":
        return ("AA", "Aa")
    return ("aa",)


def genotype_allowed_for_phenotype(
    genotype: str, phenotype: Phenotype, mode: InheritanceMode = "recessive"
) -> bool:
    if phenotype == Phenotype.AFFECTED:
        return genotype in affected_genotypes(mode)
    if phenotype == Phenotype.UNAFFECTED:
        return genotype in unaffected_genotypes(mode)
    return True


def allowed_genotypes(
    phenotype: Phenotype, mode: InheritanceMode = "recessive"
) -> tuple[str, ...]:
    if phenotype == Phenotype.AFFECTED:
        return affected_genotypes(mode)
    if phenotype == Phenotype.UNAFFECTED:
        return unaffected_genotypes(mode)
    return GENOTYPES


def child_affected_probability(parent1: str, parent2: str, mode: InheritanceMode) -> float:
    return sum(mendel_prob(parent1, parent2, child_g) for child_g in affected_genotypes(mode))


def normalize(probs: Mapping[str, float]) -> dict[str, float]:
    total = sum(probs.values())
    if total <= 0.0:
        return {k: 0.0 for k in probs}
    return {k: v / total for k, v in probs.items()}
