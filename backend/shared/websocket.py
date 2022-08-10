from dataclasses import dataclass
from typing import Type, Any, Dict, Generic, TypeVar

from simple_parsing.helpers import Serializable

T = TypeVar('T')


@dataclass
class Packet(Serializable):
    """
    Packet class represents a message that is sent through the websocket.
    """
    type: str
    """The type of the packet."""
    data: Generic[T] = None
    """The data field is the actual data that is sent through the websocket."""

    def to_dict(self, dict_factory: Type[Dict] = dict, recurse: bool = True) -> Dict:
        return {
            'type': str(self.type),
            'data': self.data.to_dict() if isinstance(self.data, Serializable) else self.data,
        }
