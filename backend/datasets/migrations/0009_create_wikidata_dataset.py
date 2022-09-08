from django.db import migrations


def forwards(apps, schema_editor):
    Dataset = apps.get_model('datasets', 'Dataset')
    Dataset.objects.create(
        id='1bee53fc-bb72-4350-90bc-106179f298c7',
        name='Wikidata SPARQL',
        description='Wikidata SPARQL from https://query.wikidata.org/sparql',
        source={"sparql": "https://query.wikidata.org/sparql", "source_type": "sparql"},
        sparql_endpoint='https://query.wikidata.org/sparql',
        statistics={"triple_count": 14032722007},
        namespaces=[],
        state='IMPORTED',
        mode='SPARQL',
        search_mode='WIKIDATA',
    )


class Migration(migrations.Migration):
    dependencies = [
        ('datasets', '0008_alter_dataset_search_mode'),
    ]
    operations = [
        migrations.RunPython(forwards, migrations.RunPython.noop),
    ]
