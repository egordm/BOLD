from django.urls import include, path
from rest_framework import routers

from datasets import views

router = routers.DefaultRouter()
router.register(r'datasets/create_existing', views.DatasetCreateExistingView, 'create_existing')
router.register(r'datasets/create_url', views.DatasetCreateUrlView, 'create_url')
router.register(r'datasets/create_lodc', views.DatasetCreateLODCView, 'create_lodc')
router.register(r'datasets', views.DatasetViewSet)


urlpatterns = [
    path('', include(router.urls)),
    path('api/data/<str:database>/search_terms', views.term_search),
    path('lodc/datasets', views.proxy_lodc_api),
]
