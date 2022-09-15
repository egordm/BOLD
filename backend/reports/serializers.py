from rest_framework import serializers

from datasets.serializers import DatasetSerializer
from reports.models import Report
from users.serializers import ShortUserSerializer


class ReportSerializer(serializers.ModelSerializer):
    dataset = DatasetSerializer(read_only=True)
    creator = ShortUserSerializer(read_only=True)

    class Meta:
        model = Report
        exclude = []
