from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType

from tasks.models import Task


class ContentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentType
        exclude = []


class TaskSerializer(serializers.ModelSerializer):
    content_type = ContentTypeSerializer(read_only=True)

    class Meta:
        model = Task
        exclude = []
