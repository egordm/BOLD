from django.apps import AppConfig

from json import JSONEncoder
from uuid import UUID

old_default = JSONEncoder.default


def new_default(self, obj):
    if isinstance(obj, UUID):
        return str(obj)
    return old_default(self, obj)


JSONEncoder.default = new_default


class TasksAppConfig(AppConfig):
    name = 'tasks'

    def ready(self):
        # noinspection PyUnresolvedReferences
        import tasks.signals
