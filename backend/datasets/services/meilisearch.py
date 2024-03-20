import os
import re
from enum import Enum
from typing import TypedDict, List

import meilisearch
import numpy as np
import pandas as pd
from meilisearch.errors import MeilisearchApiError

client = meilisearch.Client(os.environ["MEILISEARCH_ENDPOINT"], 'masterKey')


class TermPos(Enum):
    SUBJECT = 'SUBJECT'
    PREDICATE = 'PREDICATE'
    OBJECT = 'OBJECT'

    def to_int(self):
        match self:
            case TermPos.SUBJECT:
                return 0
            case TermPos.PREDICATE:
                return 1
            case TermPos.OBJECT:
                return 2

    @staticmethod
    def from_int(value: int):
        match value:
            case 0:
                return TermPos.SUBJECT
            case 1:
                return TermPos.PREDICATE
            case 2:
                return TermPos.OBJECT


class TermIndexDocument(TypedDict):
    id: int
    iri: str
    iri_text: str
    label: str
    count: int
    pos: int
    rdf_type: str
    description: str
    is_url: bool


def create_terms_index(index_name: str):
    client.create_index(
        uid=index_name,
        options={
            'primaryKey': 'id',
        }
    )

    client.index(index_name).update_settings({
        "filterableAttributes": [
            "rdf_type",
            "pos",
            "is_url",
        ],
        "searchableAttributes": [
            "iri_text",
            "label",
            "description",
        ],
        "sortableAttributes": [
            "count",
        ],
    })


def index_terms(
        index_name: str,
        data: List[TermIndexDocument],
        batch_size: int = 5000,
) -> int:
    index = client.index(index_name)

    for batch in range(0, len(data), batch_size):
        index.add_documents(data[batch:batch + batch_size])

    return len(data)


def _prepare_data(data: pd.DataFrame):
    data['is_url'] = data.iri.str.startswith('<http')

    def clean_iri(iri):
        if not iri.startswith('<http'):
            return iri

        try:
            path = iri[1:-1].split('/')[-1]
            path = re.sub(r"([-_#])", " ", path)
            path = re.sub((r"(?<![A-Z])([A-Z])"), r" \1", path)

            return path
        except Exception:
            return iri

    data['iri_text'] = data.iri.apply(clean_iri)

    return data


def index_terms_from_csv(
        index_name: str,
        csv_path: str,
        start_id: int = 0,
):
    row_count = 0
    for chunk in pd.read_csv(csv_path, chunksize=10 ** 5):
        chunk['id'] = chunk.index + start_id
        chunk = chunk.replace({np.nan: None})
        chunk = _prepare_data(chunk)

        data = chunk.to_dict(orient='records')
        row_count += index_terms(index_name, data)
        start_id += len(data)

    return row_count


def search_terms(
        index_name: str,
        query: str,
        pos: TermPos,
        limit: int = 100,
        offset: int = 0,
        is_url: bool = False,
        min_count: int = None,
        max_count: int = None,
):
    index = client.index(index_name)

    filters = "pos = '{}'".format(pos.to_int())
    if is_url:
        filters += " AND is_url = true"
    if min_count is not None:
        filters += " AND count >= {}".format(min_count)
    if max_count is not None:
        filters += " AND count <= {}".format(max_count)

    return index.search(query, {
        "filter": filters,
        "limit": limit,
        "offset": offset,
    })


def has_index(index_name: str):
    try:
        client.get_index(index_name)
        return True
    except MeilisearchApiError:
        return False


# create_terms_index('test1234')
# index_terms_from_csv('test1234', '/hangar/pella/projects/Web/BOLD/backend/data/foaf.csv', start_id=0)
# search_terms(
#     index_name='test1234',
#     query="name",
#     pos=TermPos.PREDICATE,
# )
