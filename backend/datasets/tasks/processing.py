import shutil
from pathlib import Path

from celery import shared_task

from datasets.services.bold_cli import BoldCli
from datasets.services.stardog_cli import StarDogCli
from shared import get_logger
from shared.paths import EXPORT_DIR, DATA_DIR
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
def process_search_index(database: str = None, min_term_count: int = 3) -> str:
    task_id = process_search_index.request.id
    logger.info(f'Starting search index processing task: {task_id}')

    export_dir = EXPORT_DIR / task_id
    export_dir.mkdir(parents=True, exist_ok=True)

    try:
        query_file = export_dir / 'query.sparql'
        terms_file = export_dir / 'terms.tsv'

        logger.info('Writing query to file')
        query = QUERY_EXPORT_SEARCH.replace('{}', str(min_term_count))
        query_file.write_text(query)

        logger.info('Exporting search terms to csv')
        consume_print(StarDogCli.user_cmd(
            [
                'query', 'execute', '--format=TSV', database,
                str(Path('/var/data/export') / query_file.relative_to(EXPORT_DIR)),
                '>', str(Path('/var/data/export') / terms_file.relative_to(EXPORT_DIR)),
            ],
            inner_bash=True,
        ))

        logger.info('Creating search index')
        search_index_dir = DATA_DIR / f'search_index_{database}'
        search_index_dir.mkdir(parents=True, exist_ok=True)
        consume_print(BoldCli.cmd(
            ['build-index', '--force', str(terms_file), str(search_index_dir)]
        ))

        logger.info('Search index created')
    finally:
        shutil.rmtree(export_dir)
