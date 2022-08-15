# Generated by Django 4.1 on 2022-08-15 19:49

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('datasets', '0007_alter_dataset_mode_alter_dataset_search_mode'),
    ]

    operations = [
        migrations.AlterField(
            model_name='dataset',
            name='search_mode',
            field=models.CharField(choices=[('LOCAL', 'Imported locally '), ('WIKIDATA', 'From Wikidata'), ('TRIPLYDB', 'From TripyDB')], default='LOCAL', max_length=255),
        ),
    ]
