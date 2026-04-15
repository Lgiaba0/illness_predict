from src.domain.models import Pedigree, Person, Phenotype
from src.inference.engine import ExactInferenceEngine


def test_child_risk_for_unaffected_parents_with_affected_child_evidence() -> None:
    people = {
        "father": Person(id="father", phenotype=Phenotype.UNAFFECTED),
        "mother": Person(id="mother", phenotype=Phenotype.UNAFFECTED),
        "child1": Person(
            id="child1",
            phenotype=Phenotype.AFFECTED,
            father_id="father",
            mother_id="mother",
        ),
    }
    pedigree = Pedigree(people=people)
    engine = ExactInferenceEngine(allele_frequency=0.01, max_individuals=10)

    result = engine.infer_child_risk(
        pedigree=pedigree,
        father_id="father",
        mother_id="mother",
    )

    assert abs(result.parent_marginals["father"]["Aa"] - 1.0) < 1e-9
    assert abs(result.parent_marginals["mother"]["Aa"] - 1.0) < 1e-9
    assert abs(result.child_affected_probability - 0.25) < 1e-9


def test_auto_mode_prefers_dominant_when_pattern_matches() -> None:
    people = {
        "father": Person(id="father", phenotype=Phenotype.AFFECTED),
        "mother": Person(id="mother", phenotype=Phenotype.AFFECTED),
        "child1": Person(
            id="child1",
            phenotype=Phenotype.UNAFFECTED,
            father_id="father",
            mother_id="mother",
        ),
    }
    pedigree = Pedigree(people=people)
    engine = ExactInferenceEngine(allele_frequency=0.01, max_individuals=10)

    result = engine.infer_child_risk(
        pedigree=pedigree,
        father_id="father",
        mother_id="mother",
    )

    assert result.inheritance_mode == "dominant"
    assert result.model_scores["dominant"] > 0.99
