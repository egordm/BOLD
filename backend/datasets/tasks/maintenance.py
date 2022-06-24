from uuid import UUID

from celery import shared_task

from datasets.models import Dataset
from datasets.services.stardog_api import StardogApi
from shared import get_logger
from shared.dict import deepget

logger = get_logger()


@shared_task()
def update_dataset_info(dataset_id: UUID):
    dataset = Dataset.objects.get(id=dataset_id)

    if dataset.database is None:
        raise Exception("Dataset has no database")

    database = dataset.database
    client = StardogApi.from_settings()

    logger.info('Retrieving namespace info')
    namespaces = client.namespaces(database)

    logger.info('Getting number of triples')
    triple_count = client.size(database)

    # path = ['results', 'bindings', 0, 'count', 'value']
    # ATOM_QUERY = 'SELECT (COUNT(DISTINCT {}) as ?count) {{ ?s ?p ?o }}'
    # subject_count = deepget(client.query(database, ATOM_QUERY.format("?s")), path, default=-1)
    # predicate_count = deepget(client.query(database, ATOM_QUERY.format("?p")), path, default=-1)
    # object_count = deepget(client.query(database, ATOM_QUERY.format("?o")), path, default=-1)

    logger.info('Saving dataset info')
    dataset = Dataset.objects.get(id=dataset_id)
    dataset.namespaces = namespaces
    dataset.statistics = {
        'triple_count': triple_count,
    }
    dataset.save()
    logger.info('Successfully updated dataset info')
