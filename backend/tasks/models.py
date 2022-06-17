from django.db import models
from django.db.models import Q
from django.db.models.query import QuerySet
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation

from celery.result import AsyncResult
from celery.utils import uuid

from shared.models import TimeStampMixin


class TaskState(object):
    PENDING = 'PENDING'
    STARTED = 'STARTED'
    RETRY = 'RETRY'
    FAILURE = 'FAILURE'
    SUCCESS = 'SUCCESS'

    @classmethod
    def lookup(cls, state):
        return getattr(cls, state)


class TaskFilterMixin(object):
    objects: models.Manager()

    def pending(self):
        return self.objects.filter(state=TaskState.PENDING)

    def started(self):
        return self.objects.filter(state=TaskState.STARTED)

    def retrying(self):
        return self.objects.filter(state=TaskState.RETRY)

    def failed(self):
        return self.objects.filter(state=TaskState.FAILURE)

    def successful(self):
        return self.objects.filter(state=TaskState.SUCCESS)

    def running(self):
        return self.objects.filter(Q(state=TaskState.PENDING) |
                                   Q(state=TaskState.STARTED) |
                                   Q(state=TaskState.RETRY))

    def ready(self):
        return self.objects.filter(Q(state=TaskState.FAILURE) |
                                   Q(state=TaskState.SUCCESS))


class TaskQuerySet(TaskFilterMixin, QuerySet):
    pass


class TaskManager(TaskFilterMixin, models.Manager):
    use_for_related_fields = True

    def get_queryset(self):
        return TaskQuerySet(self.model, using=self._db)


class Task(TimeStampMixin):
    STATES = (
        (TaskState.PENDING, 'PENDING'),
        (TaskState.STARTED, 'STARTED'),
        (TaskState.RETRY, 'RETRY'),
        (TaskState.FAILURE, 'FAILURE'),
        (TaskState.SUCCESS, 'SUCCESS'),
    )

    task_id = models.UUIDField(primary_key=True)
    state = models.CharField(choices=STATES, default=TaskState.PENDING, max_length=255)
    object_id = models.UUIDField()
    content_object = GenericForeignKey()
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)

    objects = TaskManager()

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
        Task.objects.filter(task_id=self.id).delete()
        return super(ModelAsyncResult, self).forget()


class TaskMetaFilterMixin(object):
    objects: models.Manager()

    def with_tasks(self):
        return self.objects.filter(tasks__state__isnull=False)

    def with_pending_tasks(self):
        return self.objects.filter(tasks__state=TaskState.PENDING)

    def with_started_tasks(self):
        return self.objects.filter(tasks__state=TaskState.STARTED)

    def with_retrying_tasks(self):
        return self.objects.filter(tasks__state=TaskState.RETRY)

    def with_failed_tasks(self):
        return self.objects.filter(tasks__state=TaskState.FAILURE)

    def with_successful_tasks(self):
        return self.objects.filter(tasks__state=TaskState.SUCCESS)

    def with_running_tasks(self):
        return self.objects.filter(Q(tasks__state=TaskState.PENDING) |
                                   Q(tasks__state=TaskState.STARTED) |
                                   Q(tasks__state=TaskState.RETRY))

    def with_ready_tasks(self):
        return self.objects.filter(Q(tasks__state=TaskState.FAILURE) |
                                   Q(tasks__state=TaskState.SUCCESS))

    def without_tasks(self):
        return self.objects.exclude(tasks__state__isnull=False)

    def without_pending_tasks(self):
        return self.objects.exclude(tasks__state=TaskState.PENDING)

    def without_started_tasks(self):
        return self.objects.exclude(tasks__state=TaskState.STARTED)

    def without_retrying_tasks(self):
        return self.objects.exclude(tasks__state=TaskState.RETRY)

    def without_failed_tasks(self):
        return self.objects.exclude(tasks__state=TaskState.FAILURE)

    def without_successful_tasks(self):
        return self.objects.exclude(tasks__state=TaskState.SUCCESS)

    def without_running_tasks(self):
        return self.objects.exclude(Q(tasks__state=TaskState.PENDING) |
                                    Q(tasks__state=TaskState.STARTED) |
                                    Q(tasks__state=TaskState.RETRY))

    def without_ready_tasks(self):
        return self.objects.exclude(Q(tasks__state=TaskState.FAILURE) |
                                    Q(tasks__state=TaskState.SUCCESS))


class TaskMetaQuerySet(TaskMetaFilterMixin, QuerySet):
    pass


class TaskMetaManager(TaskMetaFilterMixin, models.Manager):
    use_for_related_fields = True

    def get_queryset(self):
        return TaskMetaQuerySet(self.model, using=self._db)


class TaskMixin(models.Model):
    tasks = GenericRelation(Task)

    objects = TaskMetaManager()

    class Meta:
        abstract = True

    @property
    def has_running_task(self):
        return self.tasks.running().exists()

    @property
    def has_ready_task(self):
        return self.tasks.ready().exists()

    def apply_async(self, task_fn, *args, name=None, **kwargs):
        if 'task_id' in kwargs:
            task_id = kwargs['task_id']
        else:
            task_id = kwargs['task_id'] = uuid()

        if name is None:
            name = task_fn.__name__

        forget_if_ready(AsyncResult(task_id))
        try:
            task = Task.objects.get(task_id=task_id)
            task.content_object = self
            task.name = name
        except Task.DoesNotExist:
            task = Task(task_id=task_id, content_object=self, name=name)
        task.save()
        return task_fn.apply_async(*args, **kwargs)

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
