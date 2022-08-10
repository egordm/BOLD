from django.db import models


class TimeStampMixin(models.Model):
    """
    This class is a mixin that adds created_at and updated_at fields to any model that inherits from it.
    """
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    """The date and time when the object was created."""
    updated_at = models.DateTimeField(auto_now=True)
    """The date and time when the object was last updated."""

    class Meta:
        abstract = True
