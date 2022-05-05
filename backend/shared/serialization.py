import dataclasses
from typing import Any, Dict

from marshmallow import INCLUDE


@dataclasses.dataclass(init=False)
class Serializable:
    attrs: Dict[str, Any]

    class Meta:
        unknown = INCLUDE
        exclude = ['attrs']

    def __init__(self, **kwargs):
        fields = dataclasses.fields(self)
        names = set([f.name for f in fields])
        attrs = {}
        for k, v in kwargs.items():
            if k in names:
                setattr(self, k, v)
            else:
                attrs[k] = v

        self.attrs = attrs
