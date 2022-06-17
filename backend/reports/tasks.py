import json
from typing import List
from uuid import UUID

from django.db.models.expressions import RawSQL
from celery import shared_task
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from datasets.services.stardog_api import StardogApi
from reports.models import Report, CellType
from reports.utils import Packet, PacketType
from shared import get_logger

logger = get_logger()


@shared_task()
def run_cell(report_id: UUID, cell_id: UUID) -> str:
    logger.info(f'Running cell {cell_id} in notebook {report_id}')
    report: Report = Report.objects.get(id=report_id)
    notebook = report.notebook
    cell = notebook.get_cell(cell_id)

    print(notebook.to_dict())

    output: list = []
    match cell.cell_type:
        case CellType.code:
            connection = StardogApi.from_database(notebook.metadata.database)
            output = connection.query(cell.source, limit=100, timeout=5000)
            print(output)
            output = [
                dict(
                    output_type='execute_result',
                    execution_count=1,
                    data={
                        'application/json': {
                            'rows': [
                                {
                                    '?s': 'Tests',
                                    '?p': 'Testp',
                                    '?o': 'Test0',
                                }
                            ]
                        }
                    }
                )
            ]

    Report.objects.filter(id=report_id).update(
        data=RawSQL('''
            jsonb_set(data, %s, %s, false)
        ''', [
            f'{{cells, {cell.metadata.id}, outputs}}',
            json.dumps(output),
        ])
    )
    print(output)
    print(cell)

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        str(report_id),
        {
            'type': 'task_message',
            'message': Packet(PacketType.CELL_RESULT, {
                'cell_id': cell.metadata.id,
                'outputs': output,
            }).dumps()
        }
    )
