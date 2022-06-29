from dataclasses import dataclass
from uuid import UUID

from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.request import Request
from simple_parsing import Serializable

from datasets.models import Dataset
from datasets.services.tantivy import Tantivy, tantify_parse_doc


@dataclass
class TermDocument(Serializable):
    iri_text: str
    iri: str
    count: int
    ty: str
    pos: int
    label: str = None


@api_view(['GET'])
def term_search(request: Request, dataset_id: UUID):
    dataset = Dataset.objects.get(id=dataset_id)
    if not dataset.database:
        raise Exception('Dataset has no database')

    q = request.GET.get('query', '')
    limit = int(request.GET.get('limit', 10))
    offset = int(request.GET.get('offset', 0))
    sort_by = request.GET.get('sort_by', None)

    index = Tantivy.from_path(dataset.search_index_path)
    results = index.search(
        q, ['iri_text', 'iri', 'label', 'ty'],
        limit, offset, sort_by,
        doc_fn=tantify_parse_doc(TermDocument)
    )

    print(q)

    return JsonResponse(results.to_dict())
