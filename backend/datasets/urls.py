from django.urls import include, path
from rest_framework import routers

from datasets import views

router = routers.DefaultRouter()
router.register(r'datasets', views.DatasetViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('datasets/<uuid:id>/search', views.term_search),
    path('datasets/<uuid:id>/query', views.dataset_query),
    path('lodc/datasets', views.proxy_lodc_api),
]
