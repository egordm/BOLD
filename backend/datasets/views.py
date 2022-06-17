from dataclasses import dataclass

from django.http import JsonResponse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from rest_framework import mixins
from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.request import Request
from simple_parsing import Serializable

from datasets.models import Dataset
from datasets.serializers import DatasetSerializer, DatasetCreateUrlSerializer, DatasetCreateLODCSerializer, \
    DatasetCreateExistingSerializer
from datasets.services.tantivy import Tantivy, tantify_parse_doc
from datasets.tasks import import_kg_url, import_kg_lodc


class DatasetViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = Dataset.objects.all()
    serializer_class = DatasetSerializer
    pagination_class = LimitOffsetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'source', 'description']


class DatasetCreateExistingView(viewsets.GenericViewSet, mixins.CreateModelMixin):
    queryset = Dataset.objects.all()
    serializer_class = DatasetCreateExistingSerializer

    def post(self, request, *args, **kwargs):
        return self.create(request, *args, **kwargs)

    def perform_create(self, serializer: DatasetCreateUrlSerializer):
        serializer.save(
            database=serializer.validated_data['database'],
            source=f'existing:{serializer.validated_data["database"]}',
        )
        instance: Dataset = serializer.instance
        # instance.apply_async(
        #     import_kg_url,
        #     (instance.source, None, instance.id),
        #     name=f'Import existing dataset {instance.source}'
        # )


class DatasetCreateUrlView(viewsets.GenericViewSet, mixins.CreateModelMixin):
    queryset = Dataset.objects.all()
    serializer_class = DatasetCreateUrlSerializer

    def post(self, request, *args, **kwargs):
        return self.create(request, *args, **kwargs)

    def perform_create(self, serializer: DatasetCreateUrlSerializer):
        url = serializer.validated_data['source']
        serializer.save(
            database=None,
            source=f'url:{url}',
        )
        instance: Dataset = serializer.instance
        instance.apply_async(
            import_kg_url,
            (url, None, instance.id),
            name=f'Import URL dataset {url}'
        )


class DatasetCreateLODCView(viewsets.GenericViewSet, mixins.CreateModelMixin):
    queryset = Dataset.objects.all()
    serializer_class = DatasetCreateLODCSerializer

    def post(self, request, *args, **kwargs):
        return self.create(request, *args, **kwargs)

    def perform_create(self, serializer: DatasetCreateLODCSerializer):
        lodc_id = serializer.validated_data['source']
        serializer.save(
            database=None,
            source=f'lodc:{lodc_id}',
        )
        instance: Dataset = serializer.instance
        instance.apply_async(
            import_kg_lodc,
            (lodc_id, None, instance.id),
            name=f'Import LODC dataset {lodc_id}'
        )


@dataclass
class TermDocument(Serializable):
    iri: str
    count: int
    ty: str
    pos: int
    label: str = None


@api_view(['GET'])
def term_search(request: Request, database: str):
    q = request.GET.get('query', '')
    limit = int(request.GET.get('limit', 10))
    offset = int(request.GET.get('offset', 0))
    sort_by = request.GET.get('sort_by', None)

    index = Tantivy.from_database(database)
    results = index.search(
        q, ['iri', 'label', 'ty'],
        limit, offset, sort_by,
        doc_fn=tantify_parse_doc(TermDocument)
    )

    return JsonResponse(results.to_dict())
