from rest_framework import serializers

from datasets.models import Dataset


class DatasetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dataset
        exclude = []


class DatasetCreateExistingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dataset
        fields = ['name', 'description', 'database']


class DatasetCreateUrlSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dataset
        fields = ['name', 'description', 'source', 'sparql_endpoint']


class DatasetCreateLODCSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dataset
        fields = ['name', 'description', 'source']
