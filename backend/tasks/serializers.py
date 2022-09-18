from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType

from tasks.models import Task
from users.serializers import ShortUserSerializer


class ContentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentType
        exclude = []


class TaskSerializer(serializers.ModelSerializer):
    content_type = ContentTypeSerializer(read_only=True)
    creator = ShortUserSerializer(read_only=True)

    class Meta:
        model = Task
        exclude = []
