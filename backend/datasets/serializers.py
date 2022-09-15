from rest_framework import serializers

from datasets.models import Dataset
from users.serializers import ShortUserSerializer


class DatasetSerializer(serializers.ModelSerializer):
    creator = ShortUserSerializer(read_only=True)

    class Meta:
        model = Dataset
        exclude = []
