# Generated by Django 4.0.5 on 2022-06-24 13:55

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('datasets', '0002_dataset_database_dataset_description'),
    ]

    operations = [
        migrations.AddField(
            model_name='dataset',
            name='namespaces',
            field=models.JSONField(null=True),
        ),
    ]
