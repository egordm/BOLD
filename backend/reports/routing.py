from django.urls import path

from . import consumers

websocket_urlpatterns = [
    path(r'ws/notebook/<uuid:notebook_id>/', consumers.NotebookConsumer.as_asgi()),
]
