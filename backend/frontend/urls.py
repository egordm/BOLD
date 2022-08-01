from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, re_path

from . import views

urlpatterns = [
    path('', views.index),
    path('reports', views.reports),
    re_path(r'^report/.*', views.report),
    path('tasks', views.tasks),
    path('lodc', views.lodc),
    path('triplydb', views.triplydb),
    *static('static', document_root=settings.BASE_DIR / 'frontend' / 'static' / 'static'),
]
