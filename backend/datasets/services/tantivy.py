from dataclasses import dataclass
from pathlib import Path
from typing import List, Any, Callable

from simple_parsing import Serializable
from tantivy import Index, Document
from typing_extensions import Self

from shared.paths import DATA_DIR


@dataclass
class SearchHit(Serializable):
    score: float
    document: Serializable


@dataclass
class SearchResult(Serializable):
    count: int
    hits: List[SearchHit]


def tantify_parse_doc(cls) -> Any:
    def parse(doc: Document):
        return cls(**{
            k: next(iter(v), None)
            for k, v in doc.to_dict().items()
        })

    return parse


class Tantivy:
    index: Index

    def __init__(self, index: Index):
        self.index = index
        self.searcher = self.index.searcher()

    @staticmethod
    def from_path(path: Path) -> Self:
        if not path.exists():
            raise FileNotFoundError(f'Index not found at {path}')
        return Tantivy(Index.open(str(path)))

    def search(
        self, query: str, fields: List[str],
        limit: int = 10, offset: int = 0, sort_by: str = None,
        doc_fn: Callable[[Document], Any] = None
    ) -> SearchResult:
        if doc_fn is None:
            doc_fn = lambda doc: doc

        query = self.index.parse_query(query, fields)
        print(query)
        result = self.searcher.search(query, limit, True, sort_by, offset)

        data = SearchResult(
            count=result.count,
            hits=[
                SearchHit(
                    score=score,
                    document=doc_fn(self.searcher.doc(address))
                )
                for (score, address) in result.hits
            ]
        )

        return data
