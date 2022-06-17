from django.urls import path

from . import consumers

websocket_urlpatterns = [
    path(r'ws/tasks/', consumers.TasksConsumer.as_asgi()),
]
