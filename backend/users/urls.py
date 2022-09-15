from django.urls import path
from rest_framework_simplejwt.views import (
    TokenRefreshView, TokenVerifyView,
)

from users.views import MyTokenObtainPairView

urlpatterns = [
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
]
