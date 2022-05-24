import stardog
from typing_extensions import Self

from backend import settings


class StardogApi:
    conn: stardog.Connection

    def __init__(self, connection: stardog.Connection) -> None:
        super().__init__()
        self.conn = connection

    @staticmethod
    def from_database(database: str) -> Self:
        return StardogApi(stardog.Connection(
            database,
            endpoint=settings.STARDOG_ENDPOINT,
            username=settings.STARDOG_USER,
            password=settings.STARDOG_PASS,
        ))

    def query(self, query: str, **kwargs):
        return self.conn.select(query, **kwargs)
