from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, Optional, List
from urllib.parse import quote

import requests
from marshmallow_dataclass import class_schema

from shared.serialization import Serializable


class KGFormat(Enum):
    RDF = "rdf"
    TURTLE = "turtle"
    NTRIPLES = "nt"
    NQUADS = "nq"
    JSONLD = "jsonld"
    OWL = "owl"


KG_TERMS = [
    'rdf', 'turtle', 'ntriples', 'n-triples', 'owl', 'nquads', 'n-quads', 'jsonld', 'json-ld',
    '.nt', '.ttl', '.rdf', '.nq', '.jsonld', '.json', '.owl',
]
KG_FORMAT_TERMS = {
    KGFormat.RDF: ['rdf'],
    KGFormat.TURTLE: ['turtle', 'ttl'],
    KGFormat.NTRIPLES: ['.nt', 'ntriples', 'n-triples'],
    KGFormat.NQUADS: ['nq', 'nquads', 'n-quads'],
    KGFormat.JSONLD: ['jsonld', 'json-ld'],
    KGFormat.OWL: ['owl']
}


@dataclass(init=False)
class LODCDownload(Serializable):
    title: Optional[str] = None
    media_type: Optional[str] = field(default_factory=lambda: 'unknown')
    download_url: Optional[str] = None
    access_url: Optional[str] = None
    status: Optional[str] = None
    triples: Optional[int] = None

    @property
    def url(self) -> Optional[str]:
        return self.download_url or self.access_url

    @property
    def is_downloadable(self) -> bool:
        return self.url is not None and (self.status is None or self.status == "OK")

    @property
    def is_possibly_kg(self) -> bool:
        return (
            'html' not in self.media_type.lower()
            and 'sitemap' not in self.media_type.lower()
        )

    @property
    def is_kg(self) -> bool:
        if self.url is None or self._has_term('void'):
            return False

        for term in KG_TERMS:
            if self._has_term(term):
                return True

        return False

    def guess_format(self) -> Optional[KGFormat]:
        if not self.is_kg:
            return None

        for format, terms in KG_FORMAT_TERMS.items():
            for term in terms:
                if self._has_term(term):
                    return format

        return None

    def _has_term(self, term: str) -> bool:
        return (self.media_type is not None and term in self.media_type.lower()) \
               or (self.title is not None and term in self.title.lower()) \
               or term in self.url.lower()


@dataclass(init=False)
class LODCDataset(Serializable):
    title: str
    identifier: str
    full_download: Optional[List[LODCDownload]] = field(default_factory=list)
    other_download: Optional[List[LODCDownload]] = field(default_factory=list)
    unknown: Optional[Dict[str, Any]] = None

    def downloads(self) -> List[LODCDownload]:
        return [
            d for d in [*self.full_download, *self.other_download] if d.is_downloadable and d.is_possibly_kg
        ]


LODCDatasetSchema = class_schema(LODCDataset)


class LinkedOpenDataCloud:
    @staticmethod
    def fetch_dataset(identifier: str) -> LODCDataset:
        response = requests.get(f'https://lod-cloud.net/json/{quote(identifier)}')
        response.raise_for_status()
        return LODCDatasetSchema().load(response.json())

    @staticmethod
    def fetch_all_datasets() -> List[LODCDataset]:
        response = requests.get('https://lod-cloud.net/lod-data.json')
        response.raise_for_status()
        datasets = response.json()
        return LODCDatasetSchema(many=True).load(list(datasets.values()))


print(LinkedOpenDataCloud.fetch_dataset('A1'))
