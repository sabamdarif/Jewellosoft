import logging
from django.db.models import Count, Sum, Max
from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import Customer
from .serializers import CustomerSerializer

logger = logging.getLogger("jewellosoft.api")


class CustomerViewSet(viewsets.ModelViewSet):
    """
    Standard CRUD API for Customer models.
    Annotates total_bills, total_spent, last_visit from Invoice table.
    """
    serializer_class = CustomerSerializer
    permission_classes = [AllowAny]  # Revert to IsAuthenticated for prod

    filterset_fields = ['shop']
    search_fields = ['name', 'phone', 'customer_code']

    def get_queryset(self):
        return Customer.objects.annotate(
            total_bills=Count('invoice'),
            total_spent=Sum('invoice__grand_total'),
            last_visit=Max('invoice__created_at')
        ).order_by('-created_at')
