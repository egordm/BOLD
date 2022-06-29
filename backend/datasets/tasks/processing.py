import shutil
from pathlib import Path
from uuid import UUID

from celery import shared_task

from datasets.models import Dataset
from datasets.services.bold_cli import BoldCli
from datasets.services.stardog_api import StardogApi
from datasets.services.stardog_cli import StarDogCli
from shared import get_logger
from shared.paths import EXPORT_DIR, DATA_DIR, DOWNLOAD_DIR
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
        SELECT (?t as ?iri) (COUNT(?t) as ?count) (0 as ?pos)  
        { ?t ?p ?v }
        GROUP BY ?t HAVING (?count > {})
    } UNION {
        SELECT (?t as ?iri) (COUNT(?t) as ?count) (1 as ?pos)  
        { ?s ?t ?v }
        GROUP BY ?t HAVING (?count > {})
    } UNION {
        SELECT (?t as ?iri) (COUNT(?t) as ?count) (2 as ?pos)  
        { ?s ?p ?t FILTER(?p != rdfs:label) }
        GROUP BY ?t HAVING (?count > {})
    }

    OPTIONAL { 
        ?iri rdfs:label ?label_raw.
        FILTER (STRSTARTS(lang(?label_raw), 'en'))
    }
    OPTIONAL { ?iri rdfs:type ?type }
}
'''
# TODO: remove labels from main results


@shared_task()
def create_search_index(dataset_id: UUID, min_term_count: int = 3, path: str = None) -> str:
    dataset = Dataset.objects.get(id=dataset_id)
    logger.info(f"Creating search index for {dataset.name}")

    database = dataset.database
    if database is None:
        raise Exception("Dataset has no database")

    tmp_dir = (Path(path) if path else DOWNLOAD_DIR) / random_string(10)
    tmp_dir.mkdir(parents=True, exist_ok=True)

    try:
        terms_file = tmp_dir / 'terms.tsv'
        query = QUERY_EXPORT_SEARCH.replace('{}', str(min_term_count))

        logger.info(f'Exporting search terms to {terms_file}')
        client = StardogApi.from_settings()
        with client.query(database, query, format='text/tsv', timeout=60 * 60 * 1000, stream=True) as r:
            r.raw.decode_content = True
            with terms_file.open('wb') as f:
                # https://stackoverflow.com/a/49684845
                shutil.copyfileobj(r.raw, f)

        logger.info('Creating search index from documents')
        search_index_dir = DATA_DIR / f'search_index_{database}'
        search_index_dir.mkdir(parents=True, exist_ok=True)
        consume_print(BoldCli.cmd(
            ['build-index', '--force', str(terms_file), str(search_index_dir)]
        ))

        logger.info('Search index created')
    finally:
        logger.info(f"Cleaning up {tmp_dir}")
        shutil.rmtree(tmp_dir, ignore_errors=True)
