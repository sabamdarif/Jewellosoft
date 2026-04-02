from django.db import models
from apps.core.models import BaseModel
from apps.accounts.models import Shop

class Payment(BaseModel):
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE)

    invoice = models.ForeignKey(
        "billing.Invoice",
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )

    estimate = models.ForeignKey(
        "billing.Estimate",
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )

    amount = models.DecimalField(max_digits=12, decimal_places=2)

    PAYMENT_MODE = [
        ("cash", "Cash"),
        ("upi", "UPI"),
        ("card", "Card"),
    ]

    payment_mode = models.CharField(max_length=10, choices=PAYMENT_MODE)
    payment_date = models.DateTimeField(auto_now_add=True)