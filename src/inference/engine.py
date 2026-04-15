from __future__ import annotations

from dataclasses import dataclass

from src.domain.models import Pedigree
from src.domain.probability import (
    GENOTYPES,
    InheritanceMode,
    allowed_genotypes,
    child_affected_probability,
    founder_prior,
    mendel_prob,
)


@dataclass
class InferenceResult:
    child_affected_probability: float
    parent_joint_posterior: dict[str, dict[str, float]]
    parent_marginals: dict[str, dict[str, float]]
    genotype_posteriors: dict[str, dict[str, float]]
    explored_states: int
    inheritance_mode: str
    model_scores: dict[str, float]


class ExactInferenceEngine:
    def __init__(
        self,
        allele_frequency: float | None,
        max_individuals: int = 18,
        inheritance_mode: str = "auto",
    ) -> None:
        if allele_frequency is not None and not (0.0 < allele_frequency < 1.0):
            raise ValueError("allele_frequency must be in (0, 1) or None")
        if inheritance_mode not in ("auto", "recessive", "dominant"):
            raise ValueError("inheritance_mode must be one of: auto, recessive, dominant")

        self.allele_frequency = allele_frequency
        self.max_individuals = max_individuals
        self.inheritance_mode = inheritance_mode

    def _infer_for_mode(
        self,
        pedigree: Pedigree,
        father_id: str,
        mother_id: str,
        mode: InheritanceMode,
    ) -> tuple[InferenceResult, float]:
        order = pedigree.topological_order()
        joint_counts = {gf: {gm: 0.0 for gm in GENOTYPES} for gf in GENOTYPES}
        per_person_counts = {
            pid: {g: 0.0 for g in GENOTYPES} for pid in pedigree.person_ids()
        }

        assignment: dict[str, str] = {}
        total_mass = 0.0
        explored_states = 0

        def node_factor(person_id: str, genotype: str) -> float:
            person = pedigree.people[person_id]
            father_id_local = person.father_id
            mother_id_local = person.mother_id

            if father_id_local is None and mother_id_local is None:
                return founder_prior(genotype, self.allele_frequency)

            if father_id_local is not None and mother_id_local is not None:
                father_g = assignment[father_id_local]
                mother_g = assignment[mother_id_local]
                return mendel_prob(father_g, mother_g, genotype)

            known_parent_id = father_id_local if father_id_local is not None else mother_id_local
            known_parent_g = assignment[known_parent_id]
            total = 0.0
            for g_missing in GENOTYPES:
                total += founder_prior(g_missing, self.allele_frequency) * mendel_prob(
                    known_parent_g, g_missing, genotype
                )
            return total

        def backtrack(index: int, current_mass: float) -> None:
            nonlocal total_mass, explored_states
            if index == len(order):
                explored_states += 1
                total_mass += current_mass
                father_g = assignment[father_id]
                mother_g = assignment[mother_id]
                joint_counts[father_g][mother_g] += current_mass
                for pid, g in assignment.items():
                    per_person_counts[pid][g] += current_mass
                return

            pid = order[index]
            person = pedigree.people[pid]
            for genotype in allowed_genotypes(person.phenotype, mode=mode):
                factor = node_factor(pid, genotype)
                if factor == 0.0:
                    continue
                assignment[pid] = genotype
                backtrack(index + 1, current_mass * factor)
                del assignment[pid]

        backtrack(0, 1.0)

        if total_mass <= 0.0:
            raise ValueError(
                f"No valid genotype configuration matches phenotype constraints under {mode} mode"
            )

        parent_joint = {
            gf: {gm: joint_counts[gf][gm] / total_mass for gm in GENOTYPES}
            for gf in GENOTYPES
        }

        father_marginal = {
            gf: sum(parent_joint[gf][gm] for gm in GENOTYPES) for gf in GENOTYPES
        }
        mother_marginal = {
            gm: sum(parent_joint[gf][gm] for gf in GENOTYPES) for gm in GENOTYPES
        }

        child_risk = sum(
            parent_joint[gf][gm] * child_affected_probability(gf, gm, mode)
            for gf in GENOTYPES
            for gm in GENOTYPES
        )

        genotype_posteriors = {
            pid: {g: per_person_counts[pid][g] / total_mass for g in GENOTYPES}
            for pid in per_person_counts
        }

        return (
            InferenceResult(
                child_affected_probability=child_risk,
                parent_joint_posterior=parent_joint,
                parent_marginals={father_id: father_marginal, mother_id: mother_marginal},
                genotype_posteriors=genotype_posteriors,
                explored_states=explored_states,
                inheritance_mode=mode,
                model_scores={mode: total_mass},
            ),
            total_mass,
        )

    def infer_child_risk(
        self,
        pedigree: Pedigree,
        father_id: str,
        mother_id: str,
    ) -> InferenceResult:
        if father_id not in pedigree.people or mother_id not in pedigree.people:
            raise ValueError("father_id and mother_id must exist in pedigree")

        if len(pedigree.people) > self.max_individuals:
            raise ValueError(
                "Pedigree too large for exact enumeration in this MVP engine; "
                f"received {len(pedigree.people)} > {self.max_individuals}"
            )

        if self.inheritance_mode in ("recessive", "dominant"):
            result, _ = self._infer_for_mode(
                pedigree=pedigree,
                father_id=father_id,
                mother_id=mother_id,
                mode=self.inheritance_mode,
            )
            return result

        mode_results: dict[str, tuple[InferenceResult, float]] = {}
        for mode in ("recessive", "dominant"):
            try:
                mode_results[mode] = self._infer_for_mode(
                    pedigree=pedigree,
                    father_id=father_id,
                    mother_id=mother_id,
                    mode=mode,
                )
            except ValueError:
                continue

        if not mode_results:
            raise ValueError(
                "No valid genotype configuration matches phenotype constraints under recessive or dominant mode"
            )

        best_mode = max(mode_results.items(), key=lambda item: item[1][1])[0]
        best_result, _ = mode_results[best_mode]
        total_score = sum(score for _, score in mode_results.values())

        best_result.model_scores = {
            mode: (score / total_score if total_score > 0 else 0.0)
            for mode, (_, score) in mode_results.items()
        }
        return best_result
