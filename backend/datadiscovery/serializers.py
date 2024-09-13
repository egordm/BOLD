from rest_framework import serializers

from datasets.serializers import DatasetSerializer
from datasets.models import Dataset


class SearchSerializer(serializers.ModelSerializer):
    dataset = DatasetSerializer(read_only=True)

    class Meta:
        model = Dataset
        exclude = []
