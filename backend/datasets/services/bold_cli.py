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
    def search(
        index_path: Path,
        query: str, limit: int, offset: int,
        pos: int = None, url: int = None,
        min_count: int = None, max_count: int = None,
        **kwargs
    ) -> dict:
        filter_args = []
        if pos is not None:
            filter_args.append(f'--pos={pos}')
        if url is not None:
            filter_args.append(f'--url={url}')
        if min_count is not None:
            filter_args.append(f'--min-count={min_count}')
        if max_count is not None:
            filter_args.append(f'--max-count={max_count}')

        print([
            'search',
            '--index', str(index_path),
            '--limit', str(limit),
            '--offset', str(offset),
            *filter_args,
            query
        ])

        result_lines = list(BoldCli.cmd([
            'search',
            '--index', str(index_path),
            '--limit', str(limit),
            '--offset', str(offset),
            *filter_args,
            query
        ], ignore_errors=True, **kwargs))

        # print(''.join(result_lines))
        return json.loads(''.join(result_lines))
