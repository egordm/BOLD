from celery import signals

from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from shared.websocket import Packet
from tasks.models import ModelTaskMeta, ModelTaskMetaState


@signals.after_task_publish.connect
def handle_after_task_publish(sender=None, body=None, headers=None, **kwargs):
    if headers and 'id' in headers:
        instance = ModelTaskMeta.objects.get(task_id=headers['id'])
        instance.state = ModelTaskMetaState.PENDING
        instance.save()


@signals.task_prerun.connect
def handle_task_prerun(sender=None, task_id=None, **kwargs):
    if task_id:
        instance = ModelTaskMeta.objects.get(task_id=task_id)
        instance.state = ModelTaskMetaState.STARTED
        instance.save()


@signals.task_postrun.connect
def handle_task_postrun(sender=None, task_id=None, state=None, **kwargs):
    if task_id and state:
        instance = ModelTaskMeta.objects.get(task_id=task_id)
        instance.state = ModelTaskMetaState.lookup(state)
        instance.save()


@signals.task_failure.connect
def handle_task_failure(sender=None, task_id=None, **kwargs):
    if task_id:
        instance = ModelTaskMeta.objects.get(task_id=task_id)
        instance.state = ModelTaskMetaState.FAILURE
        instance.save()


@signals.task_revoked.connect
def handle_task_revoked(sender=None, request=None, **kwargs):
    if request and request.id:
        instance = ModelTaskMeta.objects.get(task_id=request.id)
        instance.delete()


@receiver(post_save, sender=ModelTaskMeta)
def handle_task_update(sender, instance, created, **kwargs):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        str('TASKS_GLOBAL'),
        {
            'type': 'task_updated',
            'message': str(instance.task_id)
        }
    )
