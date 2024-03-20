import cgi
import os.path
import shutil
from pathlib import Path
from typing import Optional, List
from urllib.parse import urlparse
from urllib.request import urlretrieve, urlopen

import requests
from celery import shared_task

from backend.settings import ROOT_DIR, DEBUG
from datasets.services.blazegraph import BLAZEGRAPH_ENDPOINT
from shared.logging import get_logger
from shared.paths import DOWNLOAD_DIR
from shared.random import random_string

logger = get_logger()


@shared_task()
def download_url(url: str, path: str = None) -> Optional[Path]:
    logger.info(f"Downloading knowledge graph from {url}")
    download_folder = (Path(path) if path else DOWNLOAD_DIR) / random_string(10)
    download_folder.mkdir(parents=True)

    try:
        if 'github.com' in url and 'raw' not in url:
            logger.info(f"Downloading from github raw")
            url += ('&raw=true' if urlparse(url).query else '?raw=true')
    except Exception as e:
        logger.error(f"Error preprocessing {url}: {e}")
        raise Exception(e)

    try:
        filename = None

        logger.info('Trying to infer file name')
        remotefile = urlopen(url)
        headerblob = remotefile.info().get('Content-Disposition', None)
        if headerblob:
            value, params = cgi.parse_header(headerblob)
            filename = params.get('filename', None)

        if filename is None:
            filename = os.path.basename(urlparse(url).path)
    except Exception as e:
        logger.error(f"Failed to parse URL {url}. Error: {e}")
        if not DEBUG:
            shutil.rmtree(download_folder)
        raise Exception(e)

    download_path = download_folder / filename

    try:
        logger.info(f"Downloading {url} to {download_path}")
        # TODO: add a hook to check if file is not too big
        urlretrieve(url, download_path)
        logger.info(f"Downloaded {url} to {download_path}")
    except Exception as e:
        logger.error(f"Failed to download {url}. Error: {e}")
        if not DEBUG:
            shutil.rmtree(download_folder)
        raise Exception(e)

    # TODO: We may need to rename the file extension.
    return download_path


data = """
com.bigdata.rdf.sail.truthMaintenance=false
com.bigdata.rdf.store.AbstractTripleStore.textIndex=false
blazcom.bigdata.journal.Journal.collectPlatformStatistics=true
com.bigdata.rdf.store.AbstractTripleStore.justify=false
com.bigdata.rdf.store.AbstractTripleStore.statementIdentifiers=false
com.bigdata.namespace.test.spo.com.bigdata.btree.BTree.branchingFactor=1024
com.bigdata.rdf.store.AbstractTripleStore.axiomsClass=com.bigdata.rdf.axioms.NoAxioms
com.bigdata.rdf.sail.namespace={namespace}
com.bigdata.rdf.store.AbstractTripleStore.quads=false
com.bigdata.rdf.store.AbstractTripleStore.geoSpatial=falsecom.bigdata.journal.Journal.groupCommit=false
com.bigdata.rdf.sail.isolatableIndices=false
com.bigdata.namespace.test.lex.com.bigdata.btree.BTree.branchingFactor=400
""".strip()

import_content = """
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">
<properties>
    <entry key="quiet">false</entry>
    <entry key="verbose">1</entry>
    <entry key="durableQueues">true</entry>
    <entry key="namespace">{namespace}</entry>
    <entry key="propertyFile">/opt/blazegraph-custom/RWStore.properties</entry>
    <entry key="fileOrDirs">{files}</entry>
</properties>
""".strip()


@shared_task()
def import_files(files: List[Path], database: Optional[str] = None) -> str:
    if database is None:
        database = 'a' + random_string(10)

    logger.info(f"Starting KG import {files} into {database}")
    if isinstance(files, str):
        files = Path(files)

    if isinstance(files, (Path, str)):
        if files.is_dir():
            files = list(files.glob('**/*'))
        else:
            files = [files]

    logger.info(f"Loading KG from {files}")

    paths = ','.join([
        '/' + str(file.absolute().relative_to(ROOT_DIR))
        for file in files
    ])

    response = requests.post(
        f'{BLAZEGRAPH_ENDPOINT}/blazegraph/namespace',
        headers={
            'Content-Type': 'text/plain',
        },
        data=data.format(namespace=database)
    )
    response.raise_for_status()
    logger.info(f"Created namespace {database}")

    response = requests.post(
        f'{BLAZEGRAPH_ENDPOINT}/blazegraph/dataloader',
        headers={
            'Content-Type': 'application/xml',
        },
        data=import_content.format(
            namespace=database,
            files=paths
        ).encode('utf-8')
    )
    response.raise_for_status()
    logger.info(f"Loaded KG from {files} into {database}")

    return database
