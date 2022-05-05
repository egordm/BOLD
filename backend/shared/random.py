import random
import string


def random_string(length=10) -> str:
    """
    Generates a random string of letters and digits of the specified length.
    """
    return ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(length))
