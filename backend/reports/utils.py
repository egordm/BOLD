from dataclasses import dataclass
from enum import Enum
from typing import Any, Type, Dict

from simple_parsing.helpers import Serializable


class PacketType(Enum):
    NOTEBOOK_REQUEST = 'NOTEBOOK_REQUEST'
    NOTEBOOK_DATA = 'NOTEBOOK_DATA'
    NOTEBOOK_SAVE = 'NOTEBOOK_SAVE'
    NOTEBOOK_SAVE_SUCCESS = 'NOTEBOOK_SAVE_SUCCESS'
    CELL_RUN = 'CELL_RUN'
    CELL_RESULT = 'CELL_RESULT'


@dataclass
class Packet(Serializable):
    type: PacketType
    data: Any = None

    def to_dict(self, dict_factory: Type[Dict] = dict, recurse: bool = True) -> Dict:
        return {
            'type': self.type.value,
            'data': self.data.to_dict() if isinstance(self.data, Serializable) else self.data,
        }
