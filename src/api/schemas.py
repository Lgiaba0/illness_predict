from __future__ import annotations

from pydantic import BaseModel, Field, field_validator, model_validator


class IndividualIn(BaseModel):
    id: str = Field(min_length=1)
    phenotype: str = Field(pattern="^(affected|unaffected|unknown)$")
    father_id: str | None = None
    mother_id: str | None = None


class QueryIn(BaseModel):
    father_id: str = Field(min_length=1)
    mother_id: str = Field(min_length=1)
    allele_frequency: float | None = Field(default=None, gt=0.0, lt=1.0)
    inheritance_mode: str = Field(default="auto", pattern="^(auto|recessive|dominant)$")


class InferenceRequest(BaseModel):
    individuals: list[IndividualIn] = Field(min_length=1)
    query: QueryIn

    @field_validator("individuals")
    @classmethod
    def unique_ids(cls, individuals: list[IndividualIn]) -> list[IndividualIn]:
        seen: set[str] = set()
        for person in individuals:
            if person.id in seen:
                raise ValueError(f"Duplicate individual id '{person.id}'")
            seen.add(person.id)
        return individuals

    @model_validator(mode="after")
    def validate_query_parents(self) -> "InferenceRequest":
        ids = {person.id for person in self.individuals}
        if self.query.father_id not in ids:
            raise ValueError(f"query.father_id '{self.query.father_id}' not found")
        if self.query.mother_id not in ids:
            raise ValueError(f"query.mother_id '{self.query.mother_id}' not found")
        return self


class InferenceResponse(BaseModel):
    child_affected_probability: float
    parent_joint_posterior: dict[str, dict[str, float]]
    parent_marginals: dict[str, dict[str, float]]
    genotype_posteriors: dict[str, dict[str, float]]
    inheritance_mode: str
    model_scores: dict[str, float]
    metadata: dict[str, int | float | str]
