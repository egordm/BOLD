import json
from uuid import UUID

import stardog
from celery import shared_task

from datasets.models import Dataset
from datasets.services.stardog_sparql import StardogSparql
from reports.models import Report, CellState, PacketType
from shared import get_logger
from shared.dict import deepget
from shared.query import q_json_update
from shared.websocket import Packet
from tasks.utils import send_to_group_sync

logger = get_logger()


@shared_task()
def run_cell(report_id: UUID, cell_id: UUID) -> str:
    logger.info(f'Running cell {cell_id} in notebook {report_id}')
    Report.update_cell_state(report_id, cell_id, CellState.RUNNING)

    report: Report = Report.objects.get(id=report_id)
    dataset: Dataset = report.dataset
    error = False

    try:
        cell = report.get_cell(cell_id)

        if cell is None:
            raise Exception(f'Cell {cell_id} not found in notebook {report_id}')

        if dataset.database is None:
            raise Exception(f'Dataset {dataset.id} has no database')

        timeout = deepget(cell, ['metadata', 'timeout'], 5000)

        outputs: list = []
        match cell.get('cell_type', None):
            case 'code':
                connection = StardogSparql.from_database(dataset.database)
                source = cell.get('source', '')
                limit = 100 if ' LIMIT ' not in source.upper() else None
                try:
                    output = connection.query(source, limit=limit, timeout=timeout)
                    outputs.append({
                        'output_type': 'execute_result',
                        'execute_count': 1,
                        'data': {
                            'application/sparql-results+json': json.dumps(output)
                        }
                    })
                except stardog.exceptions.StardogException as e:
                    error = True
                    outputs.append({
                        'output_type': 'error',
                        'ename': type(e).__name__,
                        'evalue': str(e),
                        'traceback': []
                    })
                except Exception as e:
                    logger.error(f'Error running cell {cell_id} in notebook {report_id}')
                    raise e

        Report.update_cell_outputs(report_id, cell_id, outputs)
    except Exception as e:
        Report.update_cell_state(report_id, cell_id, CellState.ERROR)
        raise e

    Report.update_cell_state(report_id, cell_id, CellState.ERROR if error else CellState.FINISHED)
