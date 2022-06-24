import json
from typing import List, Any

from django.db.models.expressions import RawSQL


def q_json_update(field: str, key: List[str], value: Any) -> RawSQL:
    key = ','.join(key)

    return RawSQL(f'''
            jsonb_set({field}, %s, %s, false)
        ''', [
        f'{{{key}}}',
        json.dumps(value),
    ])
