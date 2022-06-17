import uuid

from django.conf import settings
from django.db import models

from shared.models import TimeStampMixin
from tasks.models import TaskMixin


class Dataset(TaskMixin, TimeStampMixin):
    id = models.UUIDField(default=uuid.uuid4, primary_key=True)
    name = models.CharField(max_length=255)
    database = models.CharField(max_length=255, null=True)
    description = models.TextField(blank=True)
    source = models.CharField(max_length=255)
    sparql_endpoint = models.CharField(max_length=255, null=True)
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    statistics = models.JSONField(null=True)

    objects = models.Manager()
