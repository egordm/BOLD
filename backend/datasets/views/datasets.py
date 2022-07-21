import json
from uuid import UUID

from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from django_filters.rest_framework import DjangoFilterBackend

from django.http import JsonResponse
from rest_framework import filters
from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.pagination import LimitOffsetPagination

from datasets.models import Dataset
from datasets.serializers import DatasetSerializer
from datasets.services.search import TermPos
from datasets.tasks.pipeline import import_dataset, delete_dataset


class DatasetViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = Dataset.objects.all()
    serializer_class = DatasetSerializer
    pagination_class = LimitOffsetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'source', 'description']

    def perform_create(self, serializer):
        super().perform_create(serializer)
        instance: Dataset = serializer.instance
        instance.apply_async(
            import_dataset,
            (instance.id,),
            name=f'Import dataset {instance.name}'
        )

    def perform_destroy(self, instance):
        instance.apply_async(
            delete_dataset,
            (instance.id,),
            name=f'Deleting dataset {instance.name}'
        )

    def perform_update(self, serializer):
        # old_ns, new_ns = (
        #     json.dumps(serializer.validated_data.get('namespaces'), sort_keys=True),
        #     json.dumps(serializer.instance.namespaces, sort_keys=True),
        # )
        # print(old_ns==new_ns)
        # print('aaa')

        # if serializer.validated_data.get('namespaces') == 'deleted':
        super().perform_update(serializer)


def parse_int_or_none(value: str) -> int:
    if value is None:
        return None
    return int(value)


@swagger_auto_schema(methods=['get'], manual_parameters=[
    openapi.Parameter('query', openapi.IN_QUERY, "Search query", type=openapi.TYPE_STRING),
    openapi.Parameter('pos', openapi.IN_QUERY, "Term Position", type=openapi.TYPE_STRING),
    openapi.Parameter('limit', openapi.IN_QUERY, "Limit", type=openapi.TYPE_INTEGER),
    openapi.Parameter('offset', openapi.IN_QUERY, "Offset", type=openapi.TYPE_INTEGER),
    openapi.Parameter('timeout', openapi.IN_QUERY, "Timeout", type=openapi.TYPE_INTEGER),
])
@api_view(['GET'])
def term_search(request: Request, dataset_id: UUID):
    dataset = Dataset.objects.get(id=dataset_id)

    q = request.GET.get('query', '')
    pos = TermPos(request.GET.get('pos', 'OBJECT'))
    limit = int(request.GET.get('limit', 10))
    offset = int(request.GET.get('offset', 0))
    timeout = int(request.GET.get('timeout', 5000))

    result = dataset.get_search_service().search(q, pos, limit, offset, timeout)
    return JsonResponse(result.to_dict())
