from django.db import migrations
import json
from pathlib import Path


def forwards(apps, schema_editor):
    Report = apps.get_model('reports', 'Report')
    with open(Path(__file__).parent.joinpath('demo_notebook.json'), 'r') as f:
        notebook = json.load(f)

    Report.objects.create(
        id='c0b11d70-c79b-46db-8ddd-8136c06afb42',
        dataset_id='1bee53fc-bb72-4350-90bc-106179f298c7',
        notebook=notebook,
    )


class Migration(migrations.Migration):
    dependencies = [
        ('reports', '0001_initial'),
        ('datasets', '0009_create_wikidata_dataset'),
    ]
    operations = [
        migrations.RunPython(forwards, migrations.RunPython.noop),
    ]
