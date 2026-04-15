from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


class Phenotype(str, Enum):
    AFFECTED = "affected"
    UNAFFECTED = "unaffected"
    UNKNOWN = "unknown"


@dataclass(frozen=True)
class Person:
    id: str
    phenotype: Phenotype
    father_id: str | None = None
    mother_id: str | None = None


@dataclass
class Pedigree:
    people: dict[str, Person]
    _children: dict[str, list[str]] = field(default_factory=dict, init=False)

    def __post_init__(self) -> None:
        self._children = {person_id: [] for person_id in self.people}
        for person_id, person in self.people.items():
            if person.father_id == person_id or person.mother_id == person_id:
                raise ValueError(f"Person '{person_id}' cannot be their own parent")

            for parent_id in (person.father_id, person.mother_id):
                if parent_id is None:
                    continue
                if parent_id not in self.people:
                    raise ValueError(
                        f"Parent '{parent_id}' referenced by '{person_id}' does not exist"
                    )
                self._children[parent_id].append(person_id)

        self.topological_order()

    def person_ids(self) -> list[str]:
        return list(self.people.keys())

    def children_of(self, person_id: str) -> list[str]:
        return self._children.get(person_id, [])

    def topological_order(self) -> list[str]:
        in_degree = {person_id: 0 for person_id in self.people}

        for person_id, person in self.people.items():
            for parent_id in (person.father_id, person.mother_id):
                if parent_id is not None:
                    in_degree[person_id] += 1

        queue = [person_id for person_id, deg in in_degree.items() if deg == 0]
        order: list[str] = []

        while queue:
            current = queue.pop()
            order.append(current)
            for child_id in self.children_of(current):
                in_degree[child_id] -= 1
                if in_degree[child_id] == 0:
                    queue.append(child_id)

        if len(order) != len(self.people):
            raise ValueError("Pedigree graph must be acyclic")

        return order
