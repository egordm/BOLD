import re
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import IntEnum, Enum
from pathlib import Path
from typing import List, Optional

import requests
from simple_parsing import Serializable

from datasets.services.bold_cli import BoldCli


class TermPos(Enum):
    SUBJECT = 'SUBJECT'
    PREDICATE = 'PREDICATE'
    OBJECT = 'OBJECT'

    def to_int(self):
        match self:
            case TermPos.SUBJECT:
                return 0
            case TermPos.PREDICATE:
                return 1
            case TermPos.OBJECT:
                return 2

    @staticmethod
    def from_int(value: int):
        match value:
            case 0:
                return TermPos.SUBJECT
            case 1:
                return TermPos.PREDICATE
            case 2:
                return TermPos.OBJECT


@dataclass
class SearchHit(Serializable):
    score: float
    document: Serializable


@dataclass
class SearchResult(Serializable):
    count: int = field(default=0)
    hits: List[SearchHit | dict] = field(default_factory=list)
    agg: dict = field(default_factory=dict)
    error: Optional[str] = None


@dataclass
class TermDocument(Serializable):
    type: str
    search_text: str
    value: str
    pos: TermPos
    lang: Optional[str] = None
    rdf_type: Optional[str] = None
    label: Optional[str] = None
    description: Optional[str] = None
    count: Optional[int] = None


class SearchService(ABC):
    @abstractmethod
    def search(self, query, pos: TermPos, limit: int = 100, offset: int = 0, timeout=5000, **options) -> SearchResult:
        pass


def parse_int_or_none(value: str) -> int:
    if value is None:
        return None
    return int(value)


class LocalSearchService(SearchService):
    index_path: Path

    def __init__(self, index_path: Path):
        self.index_path = index_path

    def search(self, query, pos: TermPos, limit: int = 100, offset: int = 0, timeout=5000, **options) -> SearchResult:
        url = parse_int_or_none(options.get('url', None))
        min_count = parse_int_or_none(options.get('min_count', None))
        max_count = parse_int_or_none(options.get('max_count', None))

        result_data = BoldCli.search(self.index_path, query, limit, offset, pos.to_int(), url, min_count, max_count)
        return SearchResult(
            count=result_data['count'],
            hits=[
                SearchHit(
                    score=hit['score'],
                    document=self._parse_doc(hit['doc'])
                )
                for hit in result_data['hits']
            ],
            agg=result_data['agg']
        )

    def _parse_doc(self, doc: dict) -> TermDocument:
        doc = {k: v[0] for k, v in doc.items()}

        iri = doc['iri']
        type = 'uri' if 'http' in iri else 'literal'
        lang = None
        if type == 'literal' and re.match(r'^.*@[a-z]*$', iri):
            iri, lang = iri.rsplit('@', 1)

        return TermDocument(
            type=type,
            value=iri.removeprefix('<').removesuffix('>'),
            lang=lang,
            pos=TermPos.from_int(doc.get('pos', 0)),
            rdf_type=doc.get('ty', None),
            label=doc.get('label', None),
            count=doc.get('count', None),
            search_text=doc.get('iri_text', None),
        )


class WikidataSearchService(SearchService):
    def search(self, query, pos: TermPos, limit: int = 100, offset: int = 0, timeout=5000, **options) -> SearchResult:
        type = 'item'
        if pos == TermPos.PREDICATE:
            type = 'property'

        response = requests.get(
            'https://www.wikidata.org/w/api.php',
            params={
                'action': 'wbsearchentities',
                'search': query,
                'language': 'en',
                'uselang': 'en',
                'type': type,
                'format': 'json',
                'formatversion': 2,
                'errorformat': 'json',
                'limit': limit,
                'continue': offset,
            },
            timeout=timeout,
            headers={
                'User-Agent': 'https://github.com/EgorDm/BOLD',
            }
        )

        if response.status_code != 200:
            return SearchResult(error=response.text)

        result_data = response.json()
        return SearchResult(
            count=999999 if result_data['search-continue'] else offset + len(result_data['search']),
            hits=[
                SearchHit(
                    score=1.0,
                    document=self._parse_doc(hit, pos),
                )
                for hit in result_data['search']
            ],
        )

    def _parse_doc(self, doc: dict, pos: TermPos) -> TermDocument:
        return TermDocument(
            type='uri',
            value=doc['concepturi'],
            pos=pos,
            rdf_type=None,
            label=doc.get('label', None),
            description=doc.get('description', None),
            count=doc.get('count', None),
            search_text=doc.get('label', None),
        )
