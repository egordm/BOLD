from django.apps import AppConfig


class TasksAppConfig(AppConfig):
    name = 'tasks'

    def ready(self):
        # noinspection PyUnresolvedReferences
        import tasks.signals
