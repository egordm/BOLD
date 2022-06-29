from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from rest_framework import viewsets
from rest_framework.pagination import LimitOffsetPagination

from datasets.models import Dataset
from datasets.serializers import DatasetSerializer
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
            (instance.id, ),
            name=f'Import dataset {instance.name}'
        )

    def perform_destroy(self, instance):
        instance.apply_async(
            delete_dataset,
            (instance.id, ),
            name=f'Deleting dataset {instance.name}'
        )
