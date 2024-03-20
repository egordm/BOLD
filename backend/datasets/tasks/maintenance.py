from uuid import UUID

import requests
from celery import shared_task

from datasets.models import Dataset
from datasets.services.blazegraph import BLAZEGRAPH_ENDPOINT
from shared.logging import get_logger
import xml.etree.ElementTree as ET


logger = get_logger()


@shared_task()
def update_dataset_info(dataset_id: UUID):
    dataset = Dataset.objects.get(id=dataset_id)

    match dataset.mode:
        case Dataset.Mode.LOCAL.value:
            if dataset.local_database is None:
                raise Exception("Dataset has no database")

            database = dataset.local_database

            response = requests.get(f'{BLAZEGRAPH_ENDPOINT}/blazegraph/namespace/{database}/sparql')
            response.raise_for_status()
            root = ET.fromstring(response.text)

            namespaces = []
            triple_count = int(root[2][1].text)
        case Dataset.Mode.SPARQL.value:
            if dataset.sparql_endpoint is None:
                raise Exception("Dataset has no database")

            namespaces = []
            triple_count = int(dataset.get_query_service().query_select('''
                SELECT (COUNT(*) AS ?count)
                WHERE { ?s ?p ?o }
            ''', limit=1, ignore_limit=True).get('results').get('bindings')[0].get('count').get('value'))
        case _:
            raise Exception(f"Unsupported mode {dataset.mode}")

    # path = ['results', 'bindings', 0, 'count', 'value']
    # ATOM_QUERY = 'SELECT (COUNT(DISTINCT {}) as ?count) {{ ?s ?p ?o }}'
    # subject_count = deepget(client.query(database, ATOM_QUERY.format("?s")), path, default=-1)
    # predicate_count = deepget(client.query(database, ATOM_QUERY.format("?p")), path, default=-1)
    # object_count = deepget(client.query(database, ATOM_QUERY.format("?o")), path, default=-1)

    logger.info('Saving dataset info')
    dataset = Dataset.objects.get(id=dataset_id)
    dataset.namespaces = namespaces
    dataset.statistics = {
        **(dataset.statistics or {}),
        'triple_count': triple_count,
    }
    dataset.save()
    logger.info('Successfully updated dataset info')
