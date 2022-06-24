import uuid
from enum import Enum

from django.conf import settings
from django.db import models

from datasets.models import Dataset
from shared.models import TimeStampMixin
from tasks.models import TaskMixin


class Report(TaskMixin, TimeStampMixin):
    id = models.UUIDField(default=uuid.uuid4, primary_key=True)
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE)
    notebook = models.JSONField()

    objects = models.Manager()


class CellType(Enum):
    code = 'code'
    markdown = 'markdown'
