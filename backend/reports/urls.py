from django.urls import include, path
from rest_framework import routers

from . import views

router = routers.DefaultRouter()
router.register(r'reports', views.ReportViewSet)


urlpatterns = [
    path('', include(router.urls)),
    path('services/gpt_prompt', views.gpt_prompt),

]
