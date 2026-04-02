from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RateHistoryViewSet
from apps.core.views import LatestRatesView

router = DefaultRouter()
router.register(r'', RateHistoryViewSet, basename='rate')

urlpatterns = [
    path('latest/', LatestRatesView.as_view(), name='latest-rates'),
    path('', include(router.urls)),
]
