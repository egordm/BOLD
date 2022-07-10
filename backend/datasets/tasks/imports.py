import cgi
import os.path
import shutil
from pathlib import Path
from typing import Optional, List
from urllib.parse import urlparse
from urllib.request import urlretrieve, urlopen

import stardog
from celery import shared_task

from datasets.services.stardog_api import StardogApi
from shared import get_logger
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
        shutil.rmtree(download_folder)
        raise Exception(e)

    # TODO: We may need to rename the file extension.
    return download_path


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
    with StardogApi.admin() as admin:
        admin.new_database(
            database,
            {'spatial.enabled': True},
            *[
                stardog.content.File(str(file.absolute()))
                for file in files
            ]
        )

    return database
