import logging


def get_logger(name=None):
    """
    It returns a global logger object

    :param name: The name of the logger. If you don't specify a name, the root logger will be returned
    :return: A logger object.
    """
    return logging.getLogger(name or 'root')
