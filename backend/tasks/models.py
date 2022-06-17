from django.db import models
from django.db.models import Q
from django.db.models.query import QuerySet
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation

from celery.result import AsyncResult
from celery.utils import uuid


class ModelTaskMetaState(object):
    PENDING = 'PENDING'
    STARTED = 'STARTED'
    RETRY = 'RETRY'
    FAILURE = 'FAILURE'
    SUCCESS = 'SUCCESS'

    @classmethod
    def lookup(cls, state):
        return getattr(cls, state)


class ModelTaskMetaFilterMixin(object):
    objects: models.Manager()

    def pending(self):
        return self.objects.filter(state=ModelTaskMetaState.PENDING)

    def started(self):
        return self.objects.filter(state=ModelTaskMetaState.STARTED)

    def retrying(self):
        return self.objects.filter(state=ModelTaskMetaState.RETRY)

    def failed(self):
        return self.objects.filter(state=ModelTaskMetaState.FAILURE)

    def successful(self):
        return self.objects.filter(state=ModelTaskMetaState.SUCCESS)

    def running(self):
        return self.objects.filter(Q(state=ModelTaskMetaState.PENDING) |
                                   Q(state=ModelTaskMetaState.STARTED) |
                                   Q(state=ModelTaskMetaState.RETRY))

    def ready(self):
        return self.objects.filter(Q(state=ModelTaskMetaState.FAILURE) |
                                   Q(state=ModelTaskMetaState.SUCCESS))


class ModelTaskMetaQuerySet(ModelTaskMetaFilterMixin, QuerySet):
    pass


class ModelTaskMetaManager(ModelTaskMetaFilterMixin, models.Manager):
    use_for_related_fields = True

    def get_queryset(self):
        return ModelTaskMetaQuerySet(self.model, using=self._db)


class ModelTaskMeta(models.Model):
    STATES = (
        (ModelTaskMetaState.PENDING, 'PENDING'),
        (ModelTaskMetaState.STARTED, 'STARTED'),
        (ModelTaskMetaState.RETRY, 'RETRY'),
        (ModelTaskMetaState.FAILURE, 'FAILURE'),
        (ModelTaskMetaState.SUCCESS, 'SUCCESS'),
    )

    task_id = models.UUIDField(primary_key=True)
    object_id = models.UUIDField()
    content_object = GenericForeignKey()
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    state = models.CharField(choices=STATES, default=ModelTaskMetaState.PENDING, max_length=255)
    created = models.DateTimeField(auto_now_add=True, editable=False)
    updated = models.DateTimeField(auto_now=True)

    objects = ModelTaskMetaManager()

    def __str__(self):
        return '%s: %s' % (self.task_id, dict(self.STATES)[self.state])

    @property
    def result(self):
        return ModelAsyncResult(self.task_id)

    @property
    def short_id(self):
        return str(self.task_id)[:6]


class ModelAsyncResult(AsyncResult):
    def forget(self):
        ModelTaskMeta.objects.filter(task_id=self.id).delete()
        return super(ModelAsyncResult, self).forget()


class TaskFilterMixin(object):
    objects: models.Manager()

    def with_tasks(self):
        return self.objects.filter(tasks__state__isnull=False)

    def with_pending_tasks(self):
        return self.objects.filter(tasks__state=ModelTaskMetaState.PENDING)

    def with_started_tasks(self):
        return self.objects.filter(tasks__state=ModelTaskMetaState.STARTED)

    def with_retrying_tasks(self):
        return self.objects.filter(tasks__state=ModelTaskMetaState.RETRY)

    def with_failed_tasks(self):
        return self.objects.filter(tasks__state=ModelTaskMetaState.FAILURE)

    def with_successful_tasks(self):
        return self.objects.filter(tasks__state=ModelTaskMetaState.SUCCESS)

    def with_running_tasks(self):
        return self.objects.filter(Q(tasks__state=ModelTaskMetaState.PENDING) |
                                   Q(tasks__state=ModelTaskMetaState.STARTED) |
                                   Q(tasks__state=ModelTaskMetaState.RETRY))

    def with_ready_tasks(self):
        return self.objects.filter(Q(tasks__state=ModelTaskMetaState.FAILURE) |
                                   Q(tasks__state=ModelTaskMetaState.SUCCESS))

    def without_tasks(self):
        return self.objects.exclude(tasks__state__isnull=False)

    def without_pending_tasks(self):
        return self.objects.exclude(tasks__state=ModelTaskMetaState.PENDING)

    def without_started_tasks(self):
        return self.objects.exclude(tasks__state=ModelTaskMetaState.STARTED)

    def without_retrying_tasks(self):
        return self.objects.exclude(tasks__state=ModelTaskMetaState.RETRY)

    def without_failed_tasks(self):
        return self.objects.exclude(tasks__state=ModelTaskMetaState.FAILURE)

    def without_successful_tasks(self):
        return self.objects.exclude(tasks__state=ModelTaskMetaState.SUCCESS)

    def without_running_tasks(self):
        return self.objects.exclude(Q(tasks__state=ModelTaskMetaState.PENDING) |
                                    Q(tasks__state=ModelTaskMetaState.STARTED) |
                                    Q(tasks__state=ModelTaskMetaState.RETRY))

    def without_ready_tasks(self):
        return self.objects.exclude(Q(tasks__state=ModelTaskMetaState.FAILURE) |
                                    Q(tasks__state=ModelTaskMetaState.SUCCESS))


class TaskQuerySet(TaskFilterMixin, QuerySet):
    pass


class TaskManager(TaskFilterMixin, models.Manager):
    use_for_related_fields = True

    def get_queryset(self):
        return TaskQuerySet(self.model, using=self._db)


class TaskMixin(models.Model):
    tasks = GenericRelation(ModelTaskMeta)

    objects = TaskManager()

    class Meta:
        abstract = True

    @property
    def has_running_task(self):
        return self.tasks.running().exists()

    @property
    def has_ready_task(self):
        return self.tasks.ready().exists()

    def apply_async(self, task, *args, **kwargs):
        if 'task_id' in kwargs:
            task_id = kwargs['task_id']
        else:
            task_id = kwargs['task_id'] = uuid()
        forget_if_ready(AsyncResult(task_id))
        try:
            taskmeta = ModelTaskMeta.objects.get(task_id=task_id)
            taskmeta.content_object = self
        except ModelTaskMeta.DoesNotExist:
            taskmeta = ModelTaskMeta(task_id=task_id, content_object=self)
        taskmeta.save()
        return task.apply_async(*args, **kwargs)

    def get_task_results(self):
        return map(lambda x: x.result, self.tasks.all())

    def get_task_result(self, task_id):
        return self.tasks.get(task_id=task_id).result

    def clear_task_results(self):
        for task_result in self.get_task_results():
            forget_if_ready(task_result)

    def clear_task_result(self, task_id):
        task_result = self.get_task_result(task_id)
        forget_if_ready(task_result)


def forget_if_ready(async_result):
    if async_result and async_result.ready():
        async_result.forget()
