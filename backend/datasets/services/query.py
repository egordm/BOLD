import json
from abc import ABC, abstractmethod

from requests import Session

from backend.settings import BLAZEGRAPH_ENDPOINT


class QueryExecutionException(Exception):
    pass


class QueryService(ABC):
    @abstractmethod
    def query(self, query: str, limit: int = 10, timeout: int = None, **options) -> dict:
        pass

    def query_select(self, query: str, limit: int = 10, timeout: int = None, **options) -> dict:
        data = self.query(query, limit, timeout, **options)
        return json.loads(data['application/sparql-results+json'])


class LocalQueryService(QueryService):
    database: str

    def __init__(self, database: str):
        self.database = database

    def query(self, query: str, limit: int = 10, timeout: int = None, ignore_limit=False, **options) -> dict:
        if 'LIMIT' not in query.upper() and not ignore_limit:
            raise QueryExecutionException(f'SPARQL queries must specify a LIMIT')

        accept = 'text/plain' if is_graph_query(query) else 'application/sparql-results+json'

        with Session() as session:
            endpoint = f'{BLAZEGRAPH_ENDPOINT}/blazegraph/namespace/{self.database}/sparql'
            response = session.post(
                endpoint,
                data={
                    'query': query,
                    'timeout': int(timeout / 1000),
                    'limit': limit,
                },
                headers={
                    'User-Agent': 'https://github.com/EgorDm/BOLD',
                    'Accept': accept,
                },
                timeout=timeout,
                allow_redirects=False
            )

            retry_count = 0
            while response.status_code // 100 == 3 and retry_count < 3:
                request = response.request
                request.url = response.headers.get('Location')
                response = session.send(response.request)
                retry_count += 1

        if response.status_code != 200:
            raise QueryExecutionException(f'{response.status_code} {response.reason}\n{response.text}')

        if accept == 'text/plain':
            return {'application/n-triples': response.text}
        else:
            return {'application/sparql-results+json': response.text}


class SPARQLQueryService(QueryService):
    endpoint: str

    def __init__(self, endpoint: str):
        self.endpoint = endpoint

    def query(self, query: str, limit: int = 10, timeout: int = None, ignore_limit=False, **options) -> dict:
        if 'LIMIT' not in query.upper() and not ignore_limit:
            raise QueryExecutionException(f'SPARQL queries must specify a LIMIT')

        accept = 'application/n-triples' if is_graph_query(query) else 'application/sparql-results+json'

        with Session() as session:
            response = session.post(
                self.endpoint,
                data=query,
                params={
                    'limit': limit,
                    'timeout': timeout,
                },
                headers={
                    'User-Agent': 'https://github.com/EgorDm/BOLD',
                    'Content-Type': 'application/sparql-query',
                    'Accept': accept,
                },
                timeout=timeout,
                allow_redirects=False
            )

            retry_count = 0
            while response.status_code // 100 == 3 and retry_count < 3:
                request = response.request
                request.url = response.headers.get('Location')
                response = session.send(response.request)
                retry_count += 1

        if response.status_code != 200:
            raise QueryExecutionException(f'{response.status_code} {response.reason}\n{response.text}')

        if accept == 'application/n-triples':
            return {'application/n-triples': response.text}
        else:
            return {'application/sparql-results+json': response.text}


def is_graph_query(query: str) -> bool:
    return 'CONSTRUCT' in query.upper().strip() or 'DESCRIBE' in query.upper().strip()
