from typing import List, Iterator

from shared.paths import ROOT_DIR
from shared.shell import execute_command


class BoldCli:
    @staticmethod
    def cmd(command: List[str], **kwargs) -> Iterator[str]:
        yield from execute_command(
            ['dev/bold-cli', *command],
            cwd=ROOT_DIR,
            **kwargs
        )
