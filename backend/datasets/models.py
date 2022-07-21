import uuid
from enum import Enum

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from datasets.services.query import QueryService, LocalQueryService, SPARQLQueryService
from datasets.services.search import LocalSearchService, WikidataSearchService, SearchService, TriplyDBSearchService
from shared.models import TimeStampMixin
from shared.paths import DATA_DIR
from tasks.models import TaskMixin


class DatasetState(Enum):
    QUEUED = 'QUEUED'
    IMPORTING = 'IMPORTING'
    IMPORTED = 'IMPORTED'
    FAILED = 'FAILED'


class Dataset(TaskMixin, TimeStampMixin):
    STATES = ((state.value, state.value) for state in DatasetState)

    class Mode(models.TextChoices):
        LOCAL = 'LOCAL', _('Imported locally ')
        SPARQL = 'SPARQL', _('From SPARQL endpoint')

    class SearchMode(models.TextChoices):
        LOCAL = 'LOCAL', _('Imported locally ')
        WIKIDATA = 'WIKIDATA', _('From Wikidata')
        TRIPLYDB = 'TRIPLYDB', _('From TripyDB')

    id = models.UUIDField(default=uuid.uuid4, primary_key=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    source = models.JSONField()
    mode = models.CharField(max_length=255, choices=Mode.choices, default=Mode.LOCAL)
    search_mode = models.CharField(max_length=255, choices=SearchMode.choices, default=SearchMode.LOCAL)
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    local_database = models.CharField(max_length=255, null=True)
    sparql_endpoint = models.CharField(max_length=255, null=True)

    statistics = models.JSONField(null=True)
    namespaces = models.JSONField(null=True)
    state = models.CharField(choices=STATES, default=DatasetState.QUEUED.value, max_length=255)
    import_task = models.OneToOneField('tasks.Task', on_delete=models.SET_NULL, null=True)

    objects = models.Manager()

    @property
    def search_index_path(self):
        return DATA_DIR / f'search_index_{self.local_database}' if self.local_database else None

    def get_search_service(self) -> SearchService:
        match self.search_mode:
            case self.SearchMode.LOCAL:
                if not self.search_index_path.exists():
                    raise Exception('Dataset search index has not been created yet')
                return LocalSearchService(self.search_index_path)
            case self.SearchMode.WIKIDATA:
                return WikidataSearchService()
            case self.SearchMode.TRIPLYDB:
                if 'tdb_id' not in self.source:
                    raise Exception('Dataset is not a TriplyDB dataset')
                return TriplyDBSearchService(self.source['tdb_id'])
            case _:
                raise ValueError(f'Unknown search mode {self.search_mode}')

    def get_query_service(self) -> QueryService:
        match self.mode:
            case self.Mode.LOCAL:
                if not self.local_database:
                    raise Exception('Dataset local database has not been imported yet')
                return LocalQueryService(str(self.local_database))
            case self.Mode.SPARQL:
                return SPARQLQueryService(str(self.sparql_endpoint))
            case _:
                raise ValueError(f'Unknown mode {self.mode}')
