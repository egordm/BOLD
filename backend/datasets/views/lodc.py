from enum import Enum
import itertools as it
import requests
from django.core.cache import cache
from django.http import JsonResponse
from django.views.decorators.cache import cache_page
from rest_framework.decorators import api_view
from rest_framework.request import Request


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


def preprocess_download(download: dict):
    title = download.get('title', '')
    status = download.get('status', None)
    url = download.get('download_url', None) or download.get('access_url', None)
    available = url and (status is None or status == "OK")
    media_type = download.get('media_type', '')

    corpus = ' '.join([media_type, title, url or '']).lower()

    maybe_kg = (
        'html' not in media_type.lower()
        and 'sitemap' not in media_type.lower()
    )
    is_kg = url and (
        'void' not in corpus
        or any(term in corpus for term in KG_TERMS)
    )

    return {
        'url': url,
        'available': available,
        'detect_kg': 'YES' if is_kg else ('MAYBE' if maybe_kg else 'NO'),
        **download,
    }


def preprocess_dataset(dataset: dict):
    full_downloads = dataset.get('full_download', [])
    other_downloads = dataset.get('other_download', [])

    full_downloads = [preprocess_download(d) for d in full_downloads]
    other_downloads = [preprocess_download(d) for d in other_downloads]

    n_downloads_available, n_downloads_kg, n_downloads_maybekg, n_kg_available = 0, 0, 0, 0
    for d in it.chain(iter(full_downloads), iter(other_downloads)):
        n_downloads_available += d['available']
        if d['detect_kg'] == 'YES':
            n_downloads_kg += 1
        if d['detect_kg'] != 'NO':
            n_downloads_maybekg += 1
            if d['available']:
                n_kg_available += 1


    return {
        'full_downloads': full_downloads,
        'other_downloads': full_downloads,
        'n_downloads_available': n_downloads_available,
        'n_downloads_kg': n_downloads_kg,
        'n_downloads_maybekg': n_downloads_maybekg,
        'n_kg_available': n_kg_available,
        **dataset,
    }


@api_view(['GET'])
def proxy_lodc_api(request: Request):
    datasets = cache.get('lodc_datasets')

    if datasets is None:
        response = requests.get('https://lod-cloud.net/lod-data.json', stream=True)
        datasets = response.json()
        for k, v in datasets.items():
            try:
                datasets[k] = preprocess_dataset(v)
            except Exception:
                pass

        cache.set('lodc_datasets', datasets, timeout=60 * 60 * 24)

    return JsonResponse(datasets)
