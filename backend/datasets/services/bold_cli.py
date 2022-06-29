import json
from pathlib import Path
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

    @staticmethod
    def search(index_path: Path, query: str, limit: int, offset: int, sort_by: str = None, **kwargs) -> dict:
        sort_args = ['--sort-by', sort_by] if sort_by else []

        result_lines = list(BoldCli.cmd([
            'search',
            '--index', str(index_path),
            '--limit', str(limit),
            '--offset', str(offset),
            *sort_args,
            query
        ], **kwargs))

        return json.loads(''.join(result_lines))
