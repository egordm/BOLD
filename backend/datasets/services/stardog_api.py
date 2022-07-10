from typing import Optional

import stardog

from backend import settings


class StardogApi:
    endpoint: str
    credentials: str
    token: Optional[str] = None

    @staticmethod
    def admin() -> 'stardog.Admin':
        return stardog.Admin(**{
            'endpoint': settings.STARDOG_ENDPOINT,
            'username': settings.STARDOG_USER,
            'password': settings.STARDOG_PASS
        })

    @staticmethod
    def connection(name: str) -> 'stardog.Connection':
        return stardog.Connection(name, **{
            'endpoint': settings.STARDOG_ENDPOINT,
            'username': settings.STARDOG_USER,
            'password': settings.STARDOG_PASS
        })
