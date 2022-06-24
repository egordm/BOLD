from typing import Any
from uuid import UUID

from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer

from reports.models import Report
from shared import get_logger
from .tasks import run_cell
from .utils import Packet, PacketType

logger = get_logger()


class NotebookConsumer(WebsocketConsumer):
    report_id: UUID

    def connect(self):
        self.report_id = self.scope['url_route']['kwargs']['notebook_id']

        async_to_sync(self.channel_layer.group_add)(
            str(self.report_id), self.channel_name
        )
        self.accept()

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(
            str(self.report_id), self.channel_name
        )

    def receive(self, text_data):
        packet = Packet.loads_json(text_data)
        logger.info(f'Received {packet.type} packet')

        match PacketType(packet.type):
            case PacketType.CELL_RUN:
                report = self.report
                cell_id = UUID(packet.data)
                cell_index = report.notebook['cell_order'].index(str(cell_id))

                self.report.apply_async(
                    run_cell, (self.report_id, cell_id),
                    name='Run cell #{}'.format(cell_index)
                )
            case PacketType.CELL_RESULT:
                self.send_packet(PacketType.CELL_RESULT, packet.data)

    def task_message(self, event):
        if event['type'] == 'task_message':
            self.receive(event['message'])

    def send_packet(self, type: PacketType, data: Any):
        self.send(
            text_data=Packet(type, data).dumps()
        )

    @property
    def report(self) -> Report:
        report, created = Report.objects.get_or_create(
            id=self.report_id,
            defaults={
                'notebook': {
                    'id': self.report_id,
                }
            }
        )

        return report
