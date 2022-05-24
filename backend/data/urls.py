from django.urls import path
from rest_framework.urlpatterns import format_suffix_patterns

from data import views

urlpatterns = [
    path('api/data/<str:database>/search_terms', views.term_search),
]

urlpatterns = format_suffix_patterns(urlpatterns)
