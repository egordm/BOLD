from pathlib import Path
from typing import List, Iterator

from datasets.services.docker_compose import DockerCompose

CREATE_DB_OPTIONS = [
    # 'search.enabled=true',
    # 'search.index.properties.included=http:\/\/www.w3.org\/2000\/01\/rdf-schema\#label',
    'strict.parsing=false',
    'index.statistics.chains.enabled=false'
]


class StarDogCli:
    @staticmethod
    def create_db(db_name: str, data_files: List[Path], options: List[str] = None, **kwargs):
        if options is None:
            options = CREATE_DB_OPTIONS

        yield from StarDogCli.admin_cmd([
            'db', 'create',
            '-o', *options,
            '-n', db_name,
            *[str(file) for file in data_files]
        ], **kwargs)

    @staticmethod
    def admin_cmd(cmd: List[str], **kwargs):
        yield from StarDogCli.cmd(['/opt/stardog/bin/stardog-admin', *cmd], **kwargs)

    @staticmethod
    def user_cmd(cmd: List[str], **kwargs):
        yield from StarDogCli.cmd(['/opt/stardog/bin/stardog', *cmd], **kwargs)

    @staticmethod
    def cmd(cmd: List[str], inner_bash=False, **kwargs) -> Iterator[str]:
        if inner_bash:
            inner_cmd = ' '.join(cmd)
            cmd = ['bash', '-c', f'{inner_cmd}']

        yield from DockerCompose.exec('stardog', cmd, **kwargs)
