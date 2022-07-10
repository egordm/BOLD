import json
from timeit import default_timer as timer
from uuid import UUID

import stardog
from celery import shared_task

from datasets.models import Dataset

from datasets.services.stardog_api import StardogApi
from reports.models import Report, CellState
from shared import get_logger
from shared.dict import deepget

logger = get_logger()

DEFAULT_LIMIT = 100
DEFAULT_TIMEOUT = 5000


def run_sparql(database: str, source: str, timeout: int = None, limit: int = None):
    start_time = timer()
    limit = (limit or DEFAULT_LIMIT) if ' LIMIT ' not in source.upper() else None
    timeout = timeout or DEFAULT_TIMEOUT

    outputs, error = [], False
    try:
        with StardogApi.connection(database) as conn:
            output = conn.query(source, limit=limit, timeout=timeout)
        outputs.append({
            'output_type': 'execute_result',
            'execute_count': 1,
            'data': {
                'application/sparql-results+json': json.dumps(output)
            },
            'execution_time': float(timer() - start_time)
        })
    except stardog.exceptions.StardogException as e:
        error = True
        outputs.append({
            'output_type': 'error',
            'ename': type(e).__name__,
            'evalue': str(e),
            'traceback': [],
            'execution_time': float(timer() - start_time)
        })

    return outputs, error


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

        timeout = deepget(cell, ['metadata', 'timeout'], None)
        limit = deepget(cell, ['metadata', 'limit'], None)

        outputs: list = []
        cell_type = cell.get('cell_type', '')
        match cell_type:
            case 'code':
                outputs, error = run_sparql(dataset.database, cell.get('source', ''), timeout, limit)
            case _ if cell_type.startswith('widget_'):
                for source in cell.get('source', []):
                    outputs_s, error = run_sparql(dataset.database, source, timeout, limit)
                    outputs.extend(outputs_s)
                    if error:
                        break
            case _:
                raise Exception(f'Cell {cell_id} in notebook {report_id} has unknown cell type {cell_type}')

        Report.update_cell_outputs(report_id, cell_id, outputs)
    except Exception as e:
        logger.error(f'Error running cell {cell_id} in notebook {report_id}')
        Report.update_cell_state(report_id, cell_id, CellState.ERROR)
        raise e

    Report.update_cell_state(report_id, cell_id, CellState.ERROR if error else CellState.FINISHED)
