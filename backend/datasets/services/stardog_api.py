import base64
from typing import Optional

import requests
from backend import settings


class StardogApi:
    endpoint: str
    credentials: str
    token: Optional[str] = None

    def __init__(self, endpoint: str, username: str, password: str) -> None:
        super().__init__()
        self.endpoint = endpoint.rstrip('/')
        self.credentials = base64.b64encode(f'{username}:{password}'.encode('utf-8')).decode('utf-8')

    @staticmethod
    def from_settings() -> 'StardogApi':
        return StardogApi(
            endpoint=settings.STARDOG_ENDPOINT,
            username=settings.STARDOG_USER,
            password=settings.STARDOG_PASS,
        )

    def headers(self):
        return {
            'Authorization': f'Basic {self.credentials}',
        }

    def namespaces(self, database: str) -> list:
        response = requests.get(f'{self.endpoint}/{database}/namespaces', headers=self.headers())
        return response.json()['namespaces']

    def size(self, database: str) -> int:
        response = requests.get(f'{self.endpoint}/{database}/size', headers=self.headers())
        return int(response.content)

    def query(self, database: str, query: str, timeout = 5000, **kwargs) -> dict:
        response = requests.post(f'{self.endpoint}/{database}/query', headers=self.headers(), data=query, params={
            **kwargs,
            'timeout': timeout,
        })
        return response.json()
