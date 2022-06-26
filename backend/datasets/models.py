import uuid
from enum import Enum

from django.conf import settings
from django.db import models

from shared.models import TimeStampMixin
from tasks.models import TaskMixin


class DatasetState(Enum):
    QUEUED = 'QUEUED'
    IMPORTING = 'IMPORTING'
    IMPORTED = 'IMPORTED'
    FAILED = 'FAILED'


class Dataset(TaskMixin, TimeStampMixin):
    STATES = ((state.value, state.value) for state in DatasetState)

    id = models.UUIDField(default=uuid.uuid4, primary_key=True)
    name = models.CharField(max_length=255)
    database = models.CharField(max_length=255, null=True)
    description = models.TextField(blank=True)
    source = models.JSONField()
    sparql_endpoint = models.CharField(max_length=255, null=True)
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    statistics = models.JSONField(null=True)
    namespaces = models.JSONField(null=True)
    state = models.CharField(choices=STATES, default=DatasetState.QUEUED.value, max_length=255)
    import_task = models.OneToOneField('tasks.Task', on_delete=models.SET_NULL, null=True)

    objects = models.Manager()
