from typing import List, Iterator

from shared.paths import ROOT_DIR
from shared.shell import execute_command


class DockerCompose:
    @staticmethod
    def exec(container: str, command: List[str], **kwargs) -> Iterator[str]:
        yield from DockerCompose.cmd(['exec', container, *command], **kwargs)

    @staticmethod
    def cmd(command: List[str], **kwargs) -> Iterator[str]:
        yield from execute_command(
            ['docker-compose', *command],
            cwd=ROOT_DIR,
            **kwargs
        )
