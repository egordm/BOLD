from django.db import models


class Dataset(models.Model):
    name = models.CharField(max_length=255, primary_key=True)
