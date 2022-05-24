from collections import defaultdict
from pathlib import Path

from django.core.management import BaseCommand

from data.services.lodc_api import LinkedOpenDataCloudApi
from data.tasks import import_kg


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument('file', type=str)

    def handle(self, file, *args, **options):

        datasets = LinkedOpenDataCloudApi.fetch_all_datasets()
        downloadable = [d for d in datasets if len(d.downloads()) > 0]
        print(f'{len(downloadable)} datasets are downloadable')
        defdownloadable = [d for d in datasets if any(do.is_kg for do in d.downloads())]
        print(f'{len(defdownloadable)} datasets are definitely kg')

        downs = defaultdict(list)
        for d in defdownloadable:
            for do in d.downloads():
                if do.is_kg:
                    downs[do.guess_format()].append(do)

        import_kg(Path(file).absolute())
