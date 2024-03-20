import shutil
from pathlib import Path
from uuid import UUID

import requests
from celery import shared_task

from backend import settings
from backend.settings import DEBUG
from datasets.models import Dataset
from datasets.services import meilisearch
from datasets.services.blazegraph import BLAZEGRAPH_ENDPOINT
from shared.logging import get_logger
from shared.paths import DOWNLOAD_DIR, DEFAULT_SEARCH_INDEX_NAME
from shared.random import random_string

logger = get_logger()

QUERY_EXPORT_SEARCH = '''
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT
    ?iri 
    (STR(?labelRaw) AS ?label) 
    ?count 
    ?pos
    ?type
    (STR(?descriptionRaw) AS ?description)  
{
    {
        SELECT (?t as ?iri) (COUNT(?t) as ?count) ({pos} as ?pos)  
        {triple}
        GROUP BY ?t HAVING (?count > {min_count})
    }

    OPTIONAL { 
        ?iri rdfs:label ?labelRaw.
        FILTER (STRSTARTS(lang(?labelRaw), 'en') || lang(?labelRaw)='')
    }
    OPTIONAL { 
        ?iri rdfs:comment ?descriptionRaw.
        FILTER (STRSTARTS(lang(?descriptionRaw), 'en') || lang(?descriptionRaw)='')
    }
    OPTIONAL { ?iri rdfs:type ?type }
}
'''


# TODO: remove labels from main results


def query_to_file(database: str, query: str, file: Path, timeout=5000, **kwargs):
    endpoint = f'{BLAZEGRAPH_ENDPOINT}/blazegraph/namespace/{database}/sparql'
    headers = {
        'Accept': 'text/csv',
    }

    data = {
        'query': query,
        'timeout': timeout,
    }

    response = requests.post(
        endpoint,
        headers=headers,
        data=data,
        stream=True,
    )
    response.raise_for_status()

    logger.info(f"Saving query results to {file}")

    with file.open('wb') as f:
        for chunk in response.iter_content(chunk_size=4096):
            f.write(chunk)

    logger.info(f"Query results saved to {file}")


@shared_task()
def create_search_index(
        dataset_id: UUID,
        min_term_count: int = 3,
        path: str = None,
        force: bool = True,
):
    dataset = Dataset.objects.get(id=dataset_id)
    logger.info(f"Creating search index for {dataset.name}")

    database = dataset.local_database
    if database is None:
        raise Exception("Dataset has no database")

    if meilisearch.has_index(database):
        if force:
            logger.info(f"Removing existing search index at {database}")
            meilisearch.client.index(database).delete()
        else:
            logger.info(f"Search index already exists for {dataset.name}")
            return

    tmp_dir = (Path(path) if path else DOWNLOAD_DIR) / random_string(10)
    tmp_dir.mkdir(parents=True, exist_ok=True)
    try:
        terms_files = []

        terms_s_file = tmp_dir / 'terms_s.csv'
        query = QUERY_EXPORT_SEARCH \
            .replace('{triple}', '{ ?t ?p ?v }') \
            .replace('{min_count}', str(min_term_count)) \
            .replace('{pos}', '0')
        logger.info(f'Exporting subject search terms {terms_s_file}')
        query_to_file(database, query, terms_s_file, timeout=60 * 60 * 1000)
        terms_files.append(terms_s_file)

        terms_p_file = tmp_dir / 'terms_p.csv'
        query = QUERY_EXPORT_SEARCH \
            .replace('{triple}', '{ ?s ?t ?v }') \
            .replace('{min_count}', str(min_term_count)) \
            .replace('{pos}', '1')
        logger.info(f'Exporting predicate search terms {terms_p_file}')
        query_to_file(database, query, terms_p_file, timeout=60 * 60 * 1000)
        terms_files.append(terms_p_file)

        terms_o_file = tmp_dir / 'terms_o.csv'
        query = QUERY_EXPORT_SEARCH \
            .replace('{triple}', '{ ?s ?p ?t FILTER(?p != rdfs:label) }') \
            .replace('{min_count}', str(min_term_count)) \
            .replace('{pos}', '2')
        logger.info(f'Exporting object search terms {terms_o_file}')
        query_to_file(database, query, terms_o_file, timeout=60 * 60 * 1000)
        terms_files.append(terms_o_file)

        logger.info('Creating search index from documents')
        meilisearch.create_terms_index(database)

        row_count = 0
        for terms_file in terms_files:
            row_count += meilisearch.index_terms_from_csv(
                index_name=database,
                csv_path=terms_file,
                start_id=row_count
            )

        logger.info(f'Search index created with {row_count} terms')
    finally:
        logger.info(f"Cleaning up {tmp_dir}")
        if not DEBUG:
            shutil.rmtree(tmp_dir, ignore_errors=True)


@shared_task()
def create_default_search_index(
        force: bool = False,
):
    logger.info(f"Creating default search index")

    if meilisearch.has_index(DEFAULT_SEARCH_INDEX_NAME):
        if force:
            logger.info(f"Removing existing search index at {DEFAULT_SEARCH_INDEX_NAME}")
            meilisearch.client.index(DEFAULT_SEARCH_INDEX_NAME).delete()
        else:
            logger.info(f"Default search index already exists")
            return

    terms_files = [
        settings.BASE_DIR.joinpath('data', 'rdf.csv'),
        settings.BASE_DIR.joinpath('data', 'rdfs.csv'),
        settings.BASE_DIR.joinpath('data', 'owl.csv'),
        settings.BASE_DIR.joinpath('data', 'foaf.csv'),
    ]

    logger.info('Creating search index from documents')
    meilisearch.create_terms_index(DEFAULT_SEARCH_INDEX_NAME)

    row_count = 0
    for terms_file in terms_files:
        row_count += meilisearch.index_terms_from_csv(
            index_name=DEFAULT_SEARCH_INDEX_NAME,
            csv_path=terms_file,
            start_id=row_count
        )

    logger.info(f'Search index created with {row_count} terms')
