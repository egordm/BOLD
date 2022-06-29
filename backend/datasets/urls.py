from django.urls import include, path
from rest_framework import routers

from datasets import views

router = routers.DefaultRouter()
router.register(r'datasets', views.DatasetViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('terms/<uuid:dataset_id>/search', views.term_search),
    path('lodc/datasets', views.proxy_lodc_api),
]
