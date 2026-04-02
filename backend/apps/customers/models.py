from django.db import models
from apps.core.models import BaseModel
from apps.accounts.models import Shop

class Customer(BaseModel):
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name="customers")

    customer_code = models.CharField(max_length=20, unique=True, blank=True)
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=15, unique=True)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    gst_number = models.CharField(max_length=50, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    is_active = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        if not self.customer_code:
            import random
            # Auto-generate if missing
            self.customer_code = f"CUST{random.randint(10000, 99999)}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.customer_code})"