from django.urls import path
from rest_framework.urlpatterns import format_suffix_patterns

from profiling import views

urlpatterns = [
    path('api/profile/<str:database>/filtered_distribution', views.filtered_distribution),
]

urlpatterns = format_suffix_patterns(urlpatterns)
