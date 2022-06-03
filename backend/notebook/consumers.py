import json
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer


class NotebookConsumer(WebsocketConsumer):
    def connect(self):
        self.notebook_id = self.scope['url_route']['kwargs']['id']

        async_to_sync(self.channel_layer.group_add)(
            self.notebook_id,
            self.channel_name
        )

        self.accept()

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(
            self.notebook_id,
            self.channel_name
        )

    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']

        self.send(text_data=json.dumps({
            'message': message
        }))
