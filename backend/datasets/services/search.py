import json
import re
from abc import ABC, abstractmethod
from collections import defaultdict, deque
from dataclasses import dataclass, field
from enum import IntEnum, Enum
from pathlib import Path
from typing import List, Optional, Union, Any
from rest_framework.serializers import ValidationError
from fuzzywuzzy import fuzz

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
    range: Optional[str] = None

    def searchable_text(self):
        return ' '.join([
            self.search_text,
            self.label or '',
            self.description or '',
            self.value or '',
        ])


@dataclass
class SearchHit(Serializable):
    score: float
    document: Serializable | TermDocument


@dataclass
class SearchResult(Serializable):
    count: int = field(default=0)
    hits: List[SearchHit | dict] = field(default_factory=list)
    agg: dict = field(default_factory=dict)
    error: Optional[str] = None


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
            description=doc.get('description', None),
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
                'errorformat': 'plaintext',
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
            count=999999 if 'search-continue' in result_data else offset + len(result_data.get('search', [])),
            hits=[
                SearchHit(
                    score=1.0,
                    document=self._parse_doc(hit, pos),
                )
                for hit in result_data.get('search', [])
            ],
        )

    def _parse_doc(self, doc: dict, pos: TermPos) -> TermDocument:
        iri = doc['concepturi']
        if pos == TermPos.PREDICATE:
            iri = f'http://www.wikidata.org/prop/direct/{doc["id"]}'

        return TermDocument(
            type='uri',
            value=iri,
            pos=pos,
            rdf_type=None,
            label=doc.get('label', None),
            description=doc.get('description', None),
            count=doc.get('count', None),
            search_text=doc.get('label', None),
        )


class TriplyDBSearchService(SearchService):
    namespace: str

    def __init__(self, namespace: str):
        self.namespace = namespace

    def search(self, query, pos: TermPos, limit: int = 100, offset: int = 0, timeout=5000, **options) -> SearchResult:
        endpoint = self.get_endpoint()
        if not endpoint:
            raise ValidationError('Search endpoint is not reachable')

        query = self.build_query(query, pos, limit, offset)
        response = requests.post(
            endpoint,
            data=json.dumps(query),
            timeout=timeout,
            headers={
                'User-Agent': 'https://github.com/EgorDm/BOLD',
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        )

        if response.status_code != 200:
            return SearchResult(error=response.text)

        result_data = response.json()
        print(result_data)
        return SearchResult(
            count=result_data['hits']['total']['value'],
            hits=[
                SearchHit(
                    score=hit['_score'],
                    document=self._parse_doc(hit['_source'])
                )
                for hit in result_data['hits']['hits']
            ],
        )

    # noinspection PyTypeChecker
    def build_query(self, query, pos: TermPos, limit: int = 100, offset: int = 0):
        base_query = {
            'size': limit,
            'from': offset,
            'query': {"bool": defaultdict(dict)},
        }

        if pos != TermPos.PREDICATE:
            base_query['query']['bool']['must_not'] = [{
                "terms": {
                    "http://www w3 org/1999/02/22-rdf-syntax-ns#type":
                        ["http://www.w3.org/2002/07/owl#DatatypeProperty"]
                }
            }]

        if query:
            base_query['query']['bool']['must'] = [{
                "simple_query_string": {
                    "query": query
                }
            }]
            base_query['query']['bool']['should'] = [{
                "simple_query_string": {
                    "query": query,
                    "fields": [
                        "http://www w3 org/2000/01/rdf-schema#label"
                    ]
                }
            }]

        if pos == TermPos.PREDICATE:
            base_query['query']['bool']['must'] = [
                *base_query['query']['bool'].get('must', []),
                {
                    "match": {
                        "http://www w3 org/1999/02/22-rdf-syntax-ns#type":
                            "http://www.w3.org/2002/07/owl#DatatypeProperty"
                    }
                }
            ]

        return base_query

    def get_endpoint(self):
        response = requests.get(
            f'https://api.triplydb.com/datasets/{self.namespace}/services/',
            timeout=5,
            headers={
                'User-Agent': 'https://github.com/EgorDm/BOLD',
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        )

        if response.status_code != 200:
            return None

        result_data = response.json()
        for service in result_data:
            if service.get('type', None) == 'elasticSearch':
                return service['endpoint']

        return None

    def _parse_doc(self, doc: dict) -> TermDocument:
        iri = doc['@id']
        rdf_type = doc.get('http://www w3 org/1999/02/22-rdf-syntax-ns#type', None)
        pos = TermPos.PREDICATE if rdf_type == 'http://www.w3.org/2002/07/owl#DatatypeProperty' \
            else (TermPos.SUBJECT if 'http' in iri else TermPos.OBJECT)

        label = doc.get('http://www w3 org/2000/01/rdf-schema#label', None)
        search_text = label if label else re.sub(r'[-_#]', ' ', iri.split('/')[-1].split('#')[-1])

        return TermDocument(
            type='uri',
            value=doc['@id'],
            pos=pos,
            rdf_type=first_or_self(rdf_type),
            label=first_or_self(label),
            description=first_or_self(doc.get('http://www w3 org/2000/01/rdf-schema#comment', None)),
            count=None,
            search_text=first_or_self(search_text),
            range=doc.get('http://www w3 org/2000/01/rdf-schema#range', None),
        )


def first_or_self(item: Union[List[Any], Any]):
    if isinstance(item, list):
        return item[0]

    return item


def merge_results(
    a: SearchResult,
    b: SearchResult,
    query: str,
) -> SearchResult:
    score_fn = lambda x: fuzz.partial_ratio(x.document.searchable_text(), query)
    a_hits = deque((score_fn(hit), hit) for hit in a.hits)
    b_hits = deque((score_fn(hit), hit) for hit in b.hits)

    seen = set()
    hits = []
    while a_hits and b_hits:
        if a_hits[0][0] > b_hits[0][0]:
            item = a_hits.popleft()[1]
        else:
            item = b_hits.popleft()[1]

        if item.document.value not in seen:
            hits.append(item)
            seen.add(item.document.value)

    for (_, item) in a_hits + b_hits:
        if item.document.value not in seen:
            hits.append(item)
            seen.add(item.document.value)

    return SearchResult(
        count=len(hits),
        hits=hits,
    )
