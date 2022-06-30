from asgiref.sync import async_to_sync
from celery import signals
from channels.layers import get_channel_layer
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.exceptions import ObjectDoesNotExist

from tasks.models import Task, TaskState
from tasks.utils import send_to_group_sync


@signals.after_task_publish.connect
def handle_after_task_publish(sender=None, body=None, headers=None, **kwargs):
    if headers and 'id' in headers:
        try:
            instance = Task.objects.get(task_id=headers['id'])
            instance.state = TaskState.PENDING
            instance.save()
        except ObjectDoesNotExist:
            pass


@signals.task_prerun.connect
def handle_task_prerun(sender=None, task_id=None, **kwargs):
    if not task_id:
        return

    try:
        instance = Task.objects.get(task_id=task_id)
        instance.state = TaskState.STARTED
        instance.save()
    except ObjectDoesNotExist:
        pass


@signals.task_postrun.connect
def handle_task_postrun(sender=None, task_id=None, state=None, **kwargs):
    if task_id and state:
        try:
            instance = Task.objects.get(task_id=task_id)
            instance.state = TaskState.lookup(state)
            instance.save()
        except ObjectDoesNotExist:
            pass


@signals.task_failure.connect
def handle_task_failure(sender=None, task_id=None, **kwargs):
    if task_id:
        try:
            instance = Task.objects.get(task_id=task_id)
            instance.state = TaskState.FAILURE
            instance.save()
        except ObjectDoesNotExist:
            pass


@signals.task_revoked.connect
def handle_task_revoked(sender=None, request=None, **kwargs):
    if request and request.id:
        try:
            instance = Task.objects.get(task_id=request.id)
            instance.delete()
        except ObjectDoesNotExist:
            pass


@receiver(post_save, sender=Task)
def handle_task_update(sender, instance, created, **kwargs):
    send_to_group_sync(str('TASKS_GLOBAL'), {
        'type': 'task_updated',
        'message': str(instance.task_id)
    })
