import base64
import shutil
from pathlib import Path
from uuid import UUID

import requests
from celery import shared_task

from backend import settings
from datasets.models import Dataset
from datasets.services.bold_cli import BoldCli
from shared import get_logger
from shared.paths import DATA_DIR, DOWNLOAD_DIR
from shared.random import random_string
from shared.shell import consume_print

logger = get_logger()

QUERY_EXPORT_SEARCH = '''
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT
    ?iri 
    (STR(?label_raw) AS ?label)  
    ?count 
    ?pos
    ?type
{
    {
        SELECT (?t as ?iri) (COUNT(?t) as ?count) ({pos} as ?pos)  
        {triple}
        GROUP BY ?t HAVING (?count > {min_count})
    }

    OPTIONAL { 
        ?iri rdfs:label ?label_raw.
        FILTER (STRSTARTS(lang(?label_raw), 'en'))
    }
    OPTIONAL { ?iri rdfs:type ?type }
}
'''


# TODO: remove labels from main results


def query_to_file(database: str, query: str, file: Path, timeout=5000, **kwargs):
    endpoint = settings.STARDOG_ENDPOINT.rstrip('/')
    credentials = base64.b64encode(f'{settings.STARDOG_USER}:{settings.STARDOG_PASS}'.encode('utf-8')).decode(
        'utf-8')

    headers = {
        'Content-Type': 'application/sparql-query',
        'Accept': 'text/tsv',
        'Authorization': f'Basic {credentials}',
    }

    response = requests.post(f'{endpoint}/{database}/query', headers=headers, data=query, params={
        **kwargs,
        'timeout': timeout,
    }, stream=True)

    with response as r:
        r.raw.decode_content = True
        with file.open('wb') as f:
            # https://stackoverflow.com/a/49684845
            shutil.copyfileobj(r.raw, f)


@shared_task()
def create_search_index(dataset_id: UUID, min_term_count: int = 3, path: str = None) -> str:
    dataset = Dataset.objects.get(id=dataset_id)
    logger.info(f"Creating search index for {dataset.name}")

    database = dataset.local_database
    if database is None:
        raise Exception("Dataset has no database")

    tmp_dir = (Path(path) if path else DOWNLOAD_DIR) / random_string(10)
    tmp_dir.mkdir(parents=True, exist_ok=True)

    try:
        terms_files = []

        terms_s_file = tmp_dir / 'terms_s.tsv'
        query = QUERY_EXPORT_SEARCH \
            .replace('{triple}', '{ ?t ?p ?v }') \
            .replace('{min_count}', str(min_term_count)) \
            .replace('{pos}', '0')
        logger.info(f'Exporting subject search terms {terms_s_file}')
        query_to_file(database, query, terms_s_file, timeout=60 * 60 * 1000)
        terms_files.append(terms_s_file)

        terms_p_file = tmp_dir / 'terms_p.tsv'
        query = QUERY_EXPORT_SEARCH \
            .replace('{triple}', '{ ?s ?t ?v }') \
            .replace('{min_count}', str(min_term_count)) \
            .replace('{pos}', '1')
        logger.info(f'Exporting predicate search terms {terms_p_file}')
        query_to_file(database, query, terms_p_file, timeout=60 * 60 * 1000)
        terms_files.append(terms_p_file)

        terms_o_file = tmp_dir / 'terms_o.tsv'
        query = QUERY_EXPORT_SEARCH \
            .replace('{triple}', '{ ?s ?p ?t FILTER(?p != rdfs:label) }') \
            .replace('{min_count}', str(min_term_count)) \
            .replace('{pos}', '2')
        logger.info(f'Exporting object search terms {terms_o_file}')
        query_to_file(database, query, terms_o_file, timeout=60 * 60 * 1000)
        terms_files.append(terms_o_file)

        logger.info('Creating search index from documents')
        search_index_dir = DATA_DIR / f'search_index_{database}'
        search_index_dir.mkdir(parents=True, exist_ok=True)
        consume_print(BoldCli.cmd(
            ['build-index', '--force', *map(str, terms_files), '--index', str(search_index_dir)]
        ))

        logger.info('Search index created')
    finally:
        logger.info(f"Cleaning up {tmp_dir}")
        shutil.rmtree(tmp_dir, ignore_errors=True)
