import uuid
from enum import Enum

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.models import User

from datasets.services.query import QueryService, LocalQueryService, SPARQLQueryService
from datasets.services.search import LocalSearchService, WikidataSearchService, SearchService, TriplyDBSearchService
from shared.models import TimeStampMixin
from shared.paths import DATA_DIR
from tasks.models import TaskMixin
from users.mixins import OwnableMixin


class DatasetState(Enum):
    """
    The DatasetState class is an enumeration of the possible states of a dataset
    """
    QUEUED = 'QUEUED'
    IMPORTING = 'IMPORTING'
    IMPORTED = 'IMPORTED'
    FAILED = 'FAILED'


class Dataset(TaskMixin, TimeStampMixin, OwnableMixin):
    """
    The internal dataset model.
    """
    STATES = ((state.value, state.value) for state in DatasetState)

    class Mode(models.TextChoices):
        """
        The Mode class is an enumeration of the possible modes of a dataset
        """
        LOCAL = 'LOCAL', _('Imported locally ')
        SPARQL = 'SPARQL', _('From SPARQL endpoint')

    class SearchMode(models.TextChoices):
        """
        The SearchMode class is an enumeration of the possible search modes of a dataset
        """
        LOCAL = 'LOCAL', _('Imported locally ')
        WIKIDATA = 'WIKIDATA', _('From Wikidata')
        TRIPLYDB = 'TRIPLYDB', _('From TripyDB')

    id = models.UUIDField(default=uuid.uuid4, primary_key=True)
    """The identifier of the dataset."""
    name = models.CharField(max_length=255)
    """The name of the dataset."""
    description = models.TextField(blank=True)
    """The description of the dataset."""
    source = models.JSONField()
    """The source of the dataset."""
    mode = models.CharField(max_length=255, choices=Mode.choices, default=Mode.LOCAL)
    """The mode of the dataset."""
    search_mode = models.CharField(max_length=255, choices=SearchMode.choices, default=SearchMode.LOCAL)
    """The search mode of the dataset."""
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    """The user who created the dataset."""

    local_database: str = models.CharField(max_length=255, null=True)
    """The local blazegraph database identifier of the dataset."""
    sparql_endpoint = models.CharField(max_length=255, null=True)
    """The SPARQL endpoint of the dataset."""

    statistics = models.JSONField(null=True)
    """The statistics of the dataset."""
    namespaces = models.JSONField(null=True)
    """The list of sparql namespaces/prefixes in the dataset."""
    state = models.CharField(choices=STATES, default=DatasetState.QUEUED.value, max_length=255)
    """The import state of the dataset."""
    import_task = models.OneToOneField('tasks.Task', on_delete=models.SET_NULL, null=True)
    """The import task of the dataset."""

    objects = models.Manager()

    @property
    def search_index_name(self) -> str:
        """
        The path to the search index of the dataset.
        :return:
        """
        return self.local_database if self.local_database else None

    def get_search_service(self) -> SearchService:
        """
        Return appropriate search service depending on the search mode
        """
        match self.search_mode:
            case self.SearchMode.LOCAL:
                if not self.search_index_name:
                    raise Exception('Dataset search index has not been created yet')
                return LocalSearchService(index_name=self.search_index_name)
            case self.SearchMode.WIKIDATA:
                return WikidataSearchService()
            case self.SearchMode.TRIPLYDB:
                if 'tdb_id' not in self.source:
                    raise Exception('Dataset is not a TriplyDB dataset')
                return TriplyDBSearchService(self.source['tdb_id'])
            case _:
                raise ValueError(f'Unknown search mode {self.search_mode}')

    def get_query_service(self) -> QueryService:
        """
        If the mode is local, return a local query service, otherwise return a SPARQL query service
        """
        match self.mode:
            case self.Mode.LOCAL:
                if not self.local_database:
                    raise Exception('Dataset local database has not been imported yet')
                return LocalQueryService(str(self.local_database))
            case self.Mode.SPARQL:
                return SPARQLQueryService(str(self.sparql_endpoint))
            case _:
                raise ValueError(f'Unknown mode {self.mode}')

    def can_view(self, user: User):
        return bool(user)

    def can_edit(self, user: User):
        return super().can_edit(user) or self.creator == user



