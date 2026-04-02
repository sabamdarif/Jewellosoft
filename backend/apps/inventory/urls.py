from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductInventoryViewSet

router = DefaultRouter()
router.register(r'', ProductInventoryViewSet, basename='inventory')

urlpatterns = [
    path('', include(router.urls)),
]
