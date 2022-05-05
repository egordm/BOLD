from pathlib import Path
from typing import List, Iterator, Dict

from loading.utils.docker_compose import DockerCompose

CREATE_DB_OPTIONS = [
    'search.enabled=true',
    'search.index.properties.included=http:\/\/www.w3.org\/2000\/01\/rdf-schema\#label',
    'strict.parsing=false',
    'index.statistics.chains.enabled=false'
]


class StarDog:
    @staticmethod
    def create_db(db_name: str, data_file: Path, options: List[str] = None, **kwargs):
        if options is None:
            options = CREATE_DB_OPTIONS

        yield from StarDog.admin_cmd([
            'db', 'create',
            '-o', *options,
            '-n', db_name,
            str(data_file)
        ], **kwargs)

    @staticmethod
    def admin_cmd(cmd: List[str], **kwargs):
        yield from StarDog.cmd(['/opt/stardog/bin/stardog-admin', *cmd], **kwargs)

    @staticmethod
    def cmd(cmd: List[str], **kwargs) -> Iterator[str]:
        yield from DockerCompose.exec('stardog', cmd, **kwargs)
