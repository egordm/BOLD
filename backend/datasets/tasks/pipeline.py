import shutil
from uuid import UUID

from celery import shared_task

from datasets.models import Dataset
from datasets.tasks import download_url, import_files, update_dataset_info, create_search_index
from shared import get_logger
from shared.paths import DOWNLOAD_DIR
from shared.random import random_string

logger = get_logger()


@shared_task()
def import_dataset(dataset_id: UUID) -> str:
    dataset = Dataset.objects.get(id=dataset_id)
    logger.info(f"Importing dataset {dataset.name}")

    tmp_dir = DOWNLOAD_DIR / random_string(10)
    tmp_dir.mkdir(parents=True)

    try:
        source = dataset.source
        source_type = source.get('source_type', None)
        if source_type == 'urls' or source_type == 'lodc':
            urls = source.get('urls', [])
            if len(urls) == 0:
                raise Exception("No URLs specified")

            logger.info(f"Downloading {len(urls)} files")
            files = []
            for url in urls:
                file = download_url(url, str(tmp_dir))
                files.append(file)

            logger.info(f"Importing {len(files)} files")
            database = import_files(files)
        elif source_type == 'existing':
            database = source.get('database', None)
        else:
            raise Exception("Unknown source type")

        logger.info(f'Created database {database}')
        dataset.database = database
        dataset.save()

        logger.info(f"Updating dataset info")
        update_dataset_info(dataset_id)

        logger.info(f"Creating search index")
        create_search_index(dataset_id, path=str(tmp_dir))
    finally:
        logger.info(f"Cleaning up {tmp_dir}")
        shutil.rmtree(tmp_dir, ignore_errors=True)
