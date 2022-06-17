from celery import signals

from tasks.models import ModelTaskMeta, ModelTaskMetaState


@signals.after_task_publish.connect
def handle_after_task_publish(sender=None, body=None, headers=None, **kwargs):
    if headers and 'id' in headers:
        queryset = ModelTaskMeta.objects.filter(task_id=headers['id'])
        queryset.update(state=ModelTaskMetaState.PENDING)


@signals.task_prerun.connect
def handle_task_prerun(sender=None, task_id=None, **kwargs):
    if task_id:
        queryset = ModelTaskMeta.objects.filter(task_id=task_id)
        queryset.update(state=ModelTaskMetaState.STARTED)


@signals.task_postrun.connect
def handle_task_postrun(sender=None, task_id=None, state=None, **kwargs):
    if task_id and state:
        queryset = ModelTaskMeta.objects.filter(task_id=task_id)
        queryset.update(state=ModelTaskMetaState.lookup(state))


@signals.task_failure.connect
def handle_task_failure(sender=None, task_id=None, **kwargs):
    if task_id:
        queryset = ModelTaskMeta.objects.filter(task_id=task_id)
        queryset.update(state=ModelTaskMetaState.FAILURE)


@signals.task_revoked.connect
def handle_task_revoked(sender=None, request=None, **kwargs):
    if request and request.id:
        queryset = ModelTaskMeta.objects.filter(task_id=request.id)
        queryset.delete()
