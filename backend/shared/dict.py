from functools import reduce
from operator import getitem


def deepget(data, key, default=None):
    """
    It takes a dictionary, a list of keys, and a default value, and returns the value of the key in the dictionary, or the
    default value if the key is not found

    :param data: The data to search through
    :param key: The key to search for
    :param default: The default value to return if the key is not found
    :return: The value of the key in the data.
    """
    try:
        return reduce(getitem, key, data)
    except (KeyError, IndexError):
        return default


