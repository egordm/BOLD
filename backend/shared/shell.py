import subprocess
from contextlib import contextmanager
from dataclasses import dataclass
from threading import Timer
from typing import List, Union, Iterator

from shared.logging import get_logger

logger = get_logger()


@contextmanager
def with_timeout(p: subprocess.Popen, timeout: int):
    """
    It runs a function in a separate thread, and if the function doesn't return before the timeout, it kills the process

    :param p: subprocess.Popen
    :type p: subprocess.Popen
    :param timeout: The maximum time to wait for the process to finish
    :type timeout: int
    """
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
    """
    It runs a command and yields the output line by line

    :param cmd: The command to execute
    :type cmd: Union[List[str], str]
    :param timeout: The maximum time to wait for the command to finish
    :type timeout: int
    :param ignore_errors: If True, don't raise an exception if the command fails, defaults to False
    :type ignore_errors: bool (optional)
    """
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
    """
    It takes an iterator of strings and prints each line to the log

    :param it: Iterator[str]
    :type it: Iterator[str]
    """
    for line in it:
        logger.info(line)
