from collections import defaultdict
from pathlib import Path

from django.core.management import BaseCommand

from loading.services.lodc import LinkedOpenDataCloud
from loading.tasks import load_kg
from shared.paths import IMPORT_DIR


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument('file', type=str)

    def handle(self, file, *args, **options):

        datasets = LinkedOpenDataCloud.fetch_all_datasets()
        downloadable = [d for d in datasets if len(d.downloads()) > 0]
        print(f'{len(downloadable)} datasets are downloadable')
        defdownloadable = [d for d in datasets if any(do.is_kg for do in d.downloads())]
        print(f'{len(defdownloadable)} datasets are definitely kg')

        downs = defaultdict(list)
        for d in defdownloadable:
            for do in d.downloads():
                if do.is_kg:
                    downs[do.guess_format()].append(do)

        load_kg(Path(file).absolute())
