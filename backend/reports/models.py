import uuid
from enum import Enum

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.models import User

from datasets.models import Dataset
from shared.dict import deepget
from shared.models import TimeStampMixin
from shared.query import q_json_update
from shared.websocket import Packet
from tasks.models import TaskMixin
from tasks.utils import send_to_group_sync


class CellState(Enum):
    # 'FINISHED' | 'ERROR' | 'RUNNING' | 'QUEUED' | 'INITIAL'
    FINISHED = 'FINISHED'
    ERROR = 'ERROR'
    RUNNING = 'RUNNING'
    QUEUED = 'QUEUED'
    INITIAL = 'INITIAL'


class PacketType(Enum):
    CELL_RUN = 'CELL_RUN'
    CELL_RESULT = 'CELL_RESULT'
    CELL_STATE = 'CELL_STATE'


class Report(TaskMixin, TimeStampMixin):
    class ShareModes(models.TextChoices):
        PRIVATE = 'PRIVATE', _('Private')
        PUBLIC_READONLY = 'PUBLIC_READONLY', _('Public (read-only)')
        PUBLIC_READWRITE = 'PUBLIC_READWRITE', _('Public (read-write)')

    id = models.UUIDField(default=uuid.uuid4, primary_key=True)
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE)
    notebook = models.JSONField()

    share_mode = models.CharField(max_length=255, choices=ShareModes.choices, default=ShareModes.PRIVATE)
    discoverable = models.BooleanField(default=False)

    objects = models.Manager()

    def get_cell(self, cell_id: uuid.UUID):
        cell = deepget(self.notebook, ['content', 'cells', str(cell_id)])
        if cell is None:
            raise Exception(f'Cell {cell_id} not found in notebook {self.id}')

        return cell

    def get_cell_state(self, cell_id: uuid.UUID):
        state = deepget(self.notebook, ['results', 'states', str(cell_id)])
        return state

    @staticmethod
    def update_cell_state(report_id: uuid.UUID, cell_id: uuid.UUID, state: CellState):
        Report.objects.filter(id=report_id).update(
            notebook=q_json_update('notebook', ['results', 'states', str(cell_id), 'status'], state.value)
        )
        report = Report.objects.get(id=report_id)
        state = deepget(report.notebook, ['results', 'states', str(cell_id)])

        send_to_group_sync(str(report_id), {
            'type': 'task_message',
            'message': Packet(PacketType.CELL_STATE.value, {
                'cell_id': str(cell_id),
                'state': state,
            }).dumps()
        })

    @staticmethod
    def update_cell_outputs(report_id: uuid.UUID, cell_id: uuid.UUID, outputs: list):
        Report.objects.filter(id=report_id).update(
            notebook=q_json_update('notebook', ['results', 'outputs', str(cell_id)], outputs)
        )
        report = Report.objects.get(id=report_id)
        result = deepget(report.notebook, ['results', 'outputs', str(cell_id)])

        send_to_group_sync(str(report_id), {
            'type': 'task_message',
            'message': Packet(PacketType.CELL_RESULT.value, {
                'cell_id': str(cell_id),
                'outputs': result,
            }).dumps()
        })

    def can_edit(self, user: User):
        return user and (
            user.is_superuser or
            self.creator == user or
            self.share_mode == self.ShareModes.PUBLIC_READWRITE
        )

    def can_view(self, user: User):
        return user and (
            user.is_superuser or
            self.creator == user or
            self.share_mode != self.ShareModes.PRIVATE
        )
