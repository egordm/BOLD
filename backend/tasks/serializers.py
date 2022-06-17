from rest_framework import serializers

from tasks.models import ModelTaskMeta


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModelTaskMeta
        exclude = []
