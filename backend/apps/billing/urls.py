from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InvoiceViewSet, EstimateViewSet, BillingPreviewViewSet

router = DefaultRouter()
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'estimates', EstimateViewSet, basename='estimate')
router.register(r'preview', BillingPreviewViewSet, basename='preview')

urlpatterns = [
    path('', include(router.urls)),
]
