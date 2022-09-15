"""
ASGI config for backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.0/howto/deployment/asgi/
"""

import os

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

django_asgi_app = get_asgi_application()

from users.middleware import JwtAuthMiddlewareStack
import reports.routing
import tasks.routing

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        JwtAuthMiddlewareStack(
            URLRouter([
                *reports.routing.websocket_urlpatterns,
                *tasks.routing.websocket_urlpatterns,
            ])
        )
    ),
})
