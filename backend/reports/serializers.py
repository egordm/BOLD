from rest_framework import serializers

from datasets.serializers import DatasetSerializer
from reports.models import Report


class ReportSerializer(serializers.ModelSerializer):
    dataset = DatasetSerializer(read_only=True)

    class Meta:
        model = Report
        exclude = []
