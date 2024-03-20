import shutil
from pathlib import Path
from typing import List
from uuid import UUID

import requests
from celery import shared_task

from backend.settings import DEBUG
from datasets.models import Dataset, DatasetState
from datasets.services.blazegraph import BLAZEGRAPH_ENDPOINT
from datasets.tasks import download_url, import_files, update_dataset_info, create_search_index, \
    create_default_search_index
from shared.logging import get_logger
from shared.paths import DOWNLOAD_DIR
from shared.random import random_string

logger = get_logger()


@shared_task()
def import_dataset(dataset_id: UUID, files: List[str] = None) -> str:
    dataset = Dataset.objects.get(id=dataset_id)
    source = dataset.source
    logger.info(f"Importing dataset {dataset.name}")

    Dataset.objects.filter(id=dataset_id).update(
        state=DatasetState.IMPORTING.value,
        import_task_id=import_dataset.request.id,
    )
    tmp_dir = DOWNLOAD_DIR / random_string(10)
    tmp_dir.mkdir(parents=True)

    files = files or []
    files = list(map(Path, files))

    try:
        source_type = source.get('source_type', None)
        match (dataset.mode, source_type):
            case (Dataset.Mode.LOCAL.value, 'urls'):
                urls = source.get('urls', [])
                if len(urls) == 0:
                    raise Exception("No URLs specified")

                logger.info(f"Downloading {len(urls)} files")
                files = []
                for url in set(urls):
                    file = download_url(url, str(tmp_dir))
                    files.append(file)

                logger.info(f"Importing {len(files)} files")
                dataset.local_database = import_files(files)
                logger.info(f'Created database {dataset.local_database}')
            case (Dataset.Mode.LOCAL.value, 'existing'):
                dataset.local_database = source.get('database', None)
                logger.info(f'Using existing database {dataset.local_database}')
            case (Dataset.Mode.SPARQL.value, 'sparql'):
                dataset.sparql_endpoint = source.get('sparql', None)
                logger.info(f'Using sparql endpoint {dataset.sparql_endpoint}')
            case (Dataset.Mode.LOCAL.value, 'upload'):
                if len(files) == 0:
                    raise Exception("No files specified")

                dataset.local_database = import_files(files)
                logger.info(f'Using existing database {dataset.local_database}')
            case _:
                raise Exception(f"Unsupported source type {source_type}")

        dataset.save()

        logger.info(f"Updating dataset info")
        update_dataset_info(dataset_id)

        create_default_search_index(force=False)
        if dataset.search_mode == Dataset.SearchMode.LOCAL.value:
            logger.info(f"Creating search index")
            create_search_index(dataset_id, path=str(tmp_dir))

        logger.info(f"Import finished")
        Dataset.objects.filter(id=dataset_id).update(state=DatasetState.IMPORTED.value)
    except Exception as e:
        logger.error(f"Error importing dataset {dataset.name}: {e}")
        Dataset.objects.filter(id=dataset_id).update(state=DatasetState.FAILED.value)
        raise e from e
    finally:
        logger.info(f"Cleaning up {tmp_dir}")
        if not DEBUG:
            shutil.rmtree(tmp_dir, ignore_errors=True)

        for file in files:
            logger.info(f"Cleaning up {file}")
            try:
                if not DEBUG:
                    file.unlink()
            except Exception as e:
                logger.error(f"Error deleting {file}: {e}")


@shared_task()
def delete_dataset(dataset_id: UUID) -> str:
    dataset = Dataset.objects.get(id=dataset_id)
    logger.info(f"Deleting dataset {dataset.name}")

    if dataset.search_mode == Dataset.SearchMode.LOCAL.value:
        if dataset.search_index_path and dataset.search_index_path.exists():
            logger.info(f"Deleting search index {dataset.search_index_path}")
            shutil.rmtree(dataset.search_index_path)

    if dataset.mode == Dataset.Mode.LOCAL.value and dataset.local_database:
        logger.info(f"Deleting database {dataset.local_database}")

        response = requests.delete(
            f'{BLAZEGRAPH_ENDPOINT}/blazegraph/namespace/{dataset.local_database}',
            headers={
                'Content-Type': 'text/plain',
            },
        )
        response.raise_for_status()
        logger.info(f"Deleted namespace {dataset.local_database}")

    dataset.delete()
