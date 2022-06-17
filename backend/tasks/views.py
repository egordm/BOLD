import django_filters
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from rest_framework import viewsets
from rest_framework.pagination import LimitOffsetPagination

from tasks.models import ModelTaskMeta
from tasks.serializers import TaskSerializer


class ListFilter(django_filters.Filter):
    def __init__(self, filter_value=lambda x: x, **kwargs):
        super(ListFilter, self).__init__(**kwargs)
        self.filter_value_fn = filter_value

    def sanitize(self, value_list):
        return [v for v in value_list if v != u'']

    def filter(self, qs, value):
        if value:
            values = value.split(u",")
            values = self.sanitize(values)
            values = map(self.filter_value_fn, values)
            f = Q()
            for v in values:
                kwargs = {self.field_name: v}
                f = f | Q(**kwargs)
            return qs.filter(f)
        else:
            return qs


class TaskFilter(django_filters.FilterSet):
    state__in = ListFilter(field_name="state")

    class Meta:
        model = ModelTaskMeta
        fields = ['state', 'created']


class TaskViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = ModelTaskMeta.objects.all()
    serializer_class = TaskSerializer
    pagination_class = LimitOffsetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['object_id', 'status']
    filter_class = TaskFilter
