from __future__ import annotations

from fastapi import APIRouter, HTTPException

from src.api.schemas import InferenceRequest, InferenceResponse
from src.config.settings import settings
from src.domain.models import Pedigree, Person, Phenotype
from src.inference.engine import ExactInferenceEngine

router = APIRouter(prefix="/v1", tags=["inference"])


@router.post("/infer", response_model=InferenceResponse)
def infer_risk(request: InferenceRequest) -> InferenceResponse:
    try:
        people = {
            person.id: Person(
                id=person.id,
                phenotype=Phenotype(person.phenotype),
                father_id=person.father_id,
                mother_id=person.mother_id,
            )
            for person in request.individuals
        }
        pedigree = Pedigree(people=people)
        engine = ExactInferenceEngine(
            allele_frequency=request.query.allele_frequency,
            max_individuals=settings.max_individuals_exact,
            inheritance_mode=request.query.inheritance_mode,
        )
        result = engine.infer_child_risk(
            pedigree=pedigree,
            father_id=request.query.father_id,
            mother_id=request.query.mother_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return InferenceResponse(
        child_affected_probability=result.child_affected_probability,
        parent_joint_posterior=result.parent_joint_posterior,
        parent_marginals=result.parent_marginals,
        genotype_posteriors=result.genotype_posteriors,
        inheritance_mode=result.inheritance_mode,
        model_scores=result.model_scores,
        metadata={"explored_states": result.explored_states},
    )
