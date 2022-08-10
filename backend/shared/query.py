import json
from typing import List, Any

from django.db.models.expressions import RawSQL


def q_json_update(field: str, key: List[str], value: Any) -> RawSQL:
    """
    It takes a JSON field, a list of keys, and a value, and returns a RawSQL object that will update the JSON field with the
    value at the given keys

    :param field: The field to update
    :type field: str
    :param key: The key to update
    :type key: List[str]
    :param value: The value to be inserted into the JSON field
    :type value: Any
    :return: A RawSQL object.
    """
    key = ','.join(key)

    return RawSQL(f'''
            jsonb_set({field}::jsonb, %s::text[], %s::jsonb, true)
        ''', [
        f'{{{key}}}',
        json.dumps(value),
    ])
