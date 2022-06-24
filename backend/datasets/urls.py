from django.urls import include, path
from rest_framework import routers

from datasets import views

router = routers.DefaultRouter()
router.register(r'datasets', views.DatasetViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('api/data/<str:database>/search_terms', views.term_search),
    path('lodc/datasets', views.proxy_lodc_api),
]
