from django.db import migrations


def forwards(apps, schema_editor):
    from django.contrib.auth import get_user_model
    from django.conf import settings
    from reports.models import Report

    try:
        report = Report.objects.get(id='c0b11d70-c79b-46db-8ddd-8136c06afb42')
        report.share_mode = Report.ShareModes.PUBLIC_READONLY
        report.creator = get_user_model().objects.get(username=settings.DJANGO_SUPERUSER_USERNAME)

    except Report.DoesNotExist:
        print('Demo report not found, doing nothing')


class Migration(migrations.Migration):
    dependencies = [
        ('reports', '0002_create_wikidata_demo_report'),
        ('reports', '0003_report_discoverable_report_share_mode'),
        ('users', '0001_initial'),
    ]
    operations = [
        migrations.RunPython(forwards, migrations.RunPython.noop),
    ]
