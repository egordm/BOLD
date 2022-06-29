import subprocess
from contextlib import contextmanager
from dataclasses import dataclass
from threading import Timer
from typing import List, Union, Iterator

from shared import get_logger

logger = get_logger()


@contextmanager
def with_timeout(p: subprocess.Popen, timeout: int):
    def timerout(p: subprocess.Popen):
        p.kill()
        raise TimeoutError

    timer = Timer(timeout, timerout, [p])
    timer.start()
    yield
    timer.cancel()


@dataclass
class CommandFailed(Exception):
    code: int


def execute_command(
    cmd: Union[List[str], str],
    timeout: int = None,
    ignore_errors: bool = False,
    **kwargs,
) -> Iterator[str]:
    p = subprocess.Popen(
        cmd,
        shell=False,
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
        **kwargs
    )

    def run():
        for line in iter(p.stdout.readline, b''):
            line = line.rstrip().decode('utf-8')
            yield line

        p.stdout.close()
        code = p.wait()
        if code != 0 and not ignore_errors:
            raise CommandFailed(code)

    if timeout is not None:
        with with_timeout(p, timeout):
            yield from run()
    else:
        yield from run()


def consume_print(it: Iterator[str]):
    for line in it:
        logger.info(line)
