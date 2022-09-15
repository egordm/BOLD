from django.db import migrations


def generate_superuser(apps, schema_editor):
    """Create a new superuser """
    from django.contrib.auth import get_user_model
    from django.conf import settings

    superuser = get_user_model().objects.create_superuser(
        first_name='Admin',
        last_name='',
        username=settings.DJANGO_SUPERUSER_USERNAME,
        email=settings.DJANGO_SUPERUSER_EMAIL,
        password=settings.DJANGO_SUPERUSER_PASSWORD,
    )
    superuser.save()


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.RunPython(generate_superuser),
    ]
