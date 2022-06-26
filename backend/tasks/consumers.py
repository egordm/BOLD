from typing import Any

from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from django.forms.models import model_to_dict

from shared import get_logger
from shared.websocket import Packet
from tasks.models import Task
from tasks.serializers import TaskSerializer

logger = get_logger()

GLOBAL_TASKS_GROUP = 'TASKS_GLOBAL'


class TasksConsumer(WebsocketConsumer):
    def connect(self):
        async_to_sync(self.channel_layer.group_add)(
            str(GLOBAL_TASKS_GROUP), self.channel_name
        )
        self.accept()

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(
            str(GLOBAL_TASKS_GROUP), self.channel_name
        )

    def receive(self, text_data):
        packet = Packet.loads_json(text_data)
        logger.info(f'Received {packet.type} packet')

    def send_packet(self, type: str, data: Any):
        self.send(text_data=Packet(type, data).dumps())

    def task_updated(self, event):
        task: Task = Task.objects.get(task_id=event['message'])
        self.send_packet('TASK_UPDATED', TaskSerializer(task).data)
