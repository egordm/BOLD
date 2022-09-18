from django.contrib.auth.models import User


class OwnableMixin:
    def can_edit(self, user: User):
        return user.is_superuser

    def can_view(self, user: User):
        return user.is_superuser
