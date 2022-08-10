from uuid import UUID

from celery import shared_task

from datasets.models import Dataset
from datasets.services.stardog_api import StardogApi
from shared.logging import get_logger

logger = get_logger()


@shared_task()
def update_dataset_info(dataset_id: UUID):
    dataset = Dataset.objects.get(id=dataset_id)

    match dataset.mode:
        case Dataset.Mode.LOCAL.value:
            if dataset.local_database is None:
                raise Exception("Dataset has no database")

            database = dataset.local_database
            with StardogApi.admin() as admin:
                database_api = admin.database(database)

                logger.info('Retrieving namespace info')
                namespaces = database_api.namespaces()

            with StardogApi.connection(database) as conn:
                logger.info('Getting number of triples')
                triple_count = conn.size(exact=False)
        case Dataset.Mode.SPARQL.value:
            if dataset.sparql_endpoint is None:
                raise Exception("Dataset has no database")

            namespaces = []
            triple_count = int(dataset.get_query_service().query('''
                SELECT (COUNT(*) AS ?count)
                WHERE { ?s ?p ?o }
            ''', limit=1).get('results').get('bindings')[0].get('count').get('value'))
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
