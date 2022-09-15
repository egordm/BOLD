from django.conf import settings
from django.conf.urls.static import static, serve
from django.urls import path, re_path

from . import views

urlpatterns = [
    path('', views.index),
    path('reports', views.reports),
    re_path(r'^report/.*', views.report),
    path('tasks', views.tasks),
    path('lodc', views.lodc),
    path('triplydb', views.triplydb),
    # *static('static', document_root=settings.BASE_DIR / 'frontend' / 'static' / 'static'),
    re_path('^static/(?P<path>.*)$', serve, dict(document_root=settings.BASE_DIR / 'frontend' / 'static' / 'static')),
]

if not settings.DEBUG:
    urlpatterns += [
        re_path(f'^assets/(?P<path>.*)$', serve, dict(document_root=settings.STATIC_ROOT)),
    ]
