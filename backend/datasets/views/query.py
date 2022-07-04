import re
from dataclasses import dataclass
from typing import List
from uuid import UUID

from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.request import Request
from simple_parsing import Serializable

from datasets.models import Dataset
from datasets.services.bold_cli import BoldCli


@dataclass
class SearchHit(Serializable):
    score: float
    document: Serializable


@dataclass
class SearchResult(Serializable):
    count: int
    hits: List[SearchHit]
    agg: dict


@dataclass
class TermDocument(Serializable):
    iri_text: str
    iri: str
    count: int
    ty: str
    pos: int
    label: str = None


def parse_doc(doc: dict):
    doc = TermDocument(**{
        k: next(iter(v), None)
        for k, v in doc.items()
    })

    type = 'uri' if 'http' in doc.iri else 'literal'
    lang = None
    if type == 'literal' and re.match(r'^.*@[a-z]*$', doc.iri):
        doc.iri, lang = doc.iri.rsplit('@', 1)

    return {
        'type': type,
        'value': doc.iri.removeprefix('<').removesuffix('>'),
        'lang': lang,
        'pos': TERM_POSITIONS[doc.pos],
        'rdf_type': doc.ty if doc.ty else None,
        'label': doc.label if doc.label else None,
        'count': doc.count,
        'search_text': doc.iri_text,
    }


TERM_POSITIONS = [
    'SUBJECT',
    'PREDICATE',
    'OBJECT',
]


def parse_int_or_none(value: str) -> int:
    if value is None:
        return None
    return int(value)

@swagger_auto_schema(methods=['get'], manual_parameters=[
    openapi.Parameter('query', openapi.IN_QUERY, "Search query", type=openapi.TYPE_STRING),
])
@api_view(['GET'])
def term_search(request: Request, dataset_id: UUID):
    dataset = Dataset.objects.get(id=dataset_id)
    if not dataset.database:
        raise Exception('Dataset has no database')

    q = request.GET.get('query', '')
    limit = int(request.GET.get('limit', 10))
    offset = int(request.GET.get('offset', 0))
    pos = parse_int_or_none(request.GET.get('pos', None))
    url = parse_int_or_none(request.GET.get('url', None))
    min_count = parse_int_or_none(request.GET.get('min_count', None))
    max_count = parse_int_or_none(request.GET.get('max_count', None))

    result_data = BoldCli.search(dataset.search_index_path, q, limit, offset, pos, url, min_count, max_count)
    results = SearchResult(
        count=result_data['count'],
        hits=[
            SearchHit(
                score=hit['score'],
                document=parse_doc(hit['doc'])
            )
            for hit in result_data['hits']
        ],
        agg=result_data['agg']
    )

    return JsonResponse(results.to_dict())
