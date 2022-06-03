from django.db import models

from data.models import Dataset


class Notebook(models.Model):
    name = models.CharField(max_length=255)
    dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE)
    content = models.JSONField()
