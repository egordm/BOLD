from typing import List

from profiling.services.sparql import IRILiteral, StringLiteral


def parse_term(term: str):
    if term.startswith('http'):
        return IRILiteral(term)
    else:
        return StringLiteral(term)


def parse_multiterm(multiterm: List[str]):
    return [parse_term(term) for term in multiterm]
