from functools import reduce
from operator import getitem


def deepget(data, keys, default=None):
    try:
        return reduce(getitem, keys, data)
    except (KeyError, IndexError):
        return default


