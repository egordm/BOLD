import json
from timeit import default_timer as timer
from uuid import UUID

from celery import shared_task

from datasets.models import Dataset, DatasetState
from datasets.services.query import QueryExecutionException
from reports.models import Report, CellState
from shared.logging import get_logger
from shared.dict import deepget

logger = get_logger()

DEFAULT_LIMIT = 100
DEFAULT_TIMEOUT = 5000


@shared_task()
def run_cell(report_id: UUID, cell_id: UUID) -> str:
    report: Report = Report.objects.get(id=report_id)
    state = report.get_cell_state(cell_id)
    if state and state['status'] == CellState.RUNNING.value:
        raise Exception(f'Cell {cell_id} is already running')

    logger.info(f'Running cell {cell_id} in notebook {report_id}')
    Report.update_cell_state(report_id, cell_id, CellState.RUNNING)

    report: Report = Report.objects.get(id=report_id)
    dataset: Dataset = report.dataset
    error = False

    try:
        cell = report.get_cell(cell_id)

        if cell is None:
            raise Exception(f'Cell {cell_id} not found in notebook {report_id}')

        if dataset.state != DatasetState.IMPORTED.value:
            raise Exception(f'Dataset {dataset.id} is not imported yet')

        timeout = deepget(cell, ['metadata', 'timeout'], None)
        limit = deepget(cell, ['metadata', 'limit'], None)

        outputs: list = []
        cell_type = cell.get('cell_type', '')
        match cell_type:
            case 'code':
                outputs, error = run_sparql(dataset, cell.get('source', ''), timeout, limit)
            case _ if cell_type.startswith('widget_'):
                for source in cell.get('source', []):
                    outputs_s, error = run_sparql(dataset, source, timeout, limit)
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


def run_sparql(dataset: Dataset, source: str, timeout: int = None, limit: int = None):
    start_time = timer()
    limit = (limit or DEFAULT_LIMIT) if ' LIMIT ' not in source.upper() else None
    timeout = timeout or DEFAULT_TIMEOUT

    outputs, error = [], False
    try:
        output = dataset.get_query_service().query(source, limit, timeout)
        outputs.append({
            'output_type': 'execute_result',
            'execute_count': 1,
            'data': {
                'application/sparql-results+json': json.dumps(output)
            },
            'execution_time': float(timer() - start_time)
        })
    except QueryExecutionException as e:
        error = True
        outputs.append(result_error(e, float(timer() - start_time)))

    return outputs, error


def result_error(e: QueryExecutionException, duration: float):
    return {
        'output_type': 'error',
        'ename': type(e).__name__,
        'evalue': str(e),
        'traceback': [],
        'execution_time': duration
    }


