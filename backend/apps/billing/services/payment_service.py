from django.db import transaction
from apps.payments.models import Payment

@transaction.atomic
def process_payments(invoice, payment_splits):
    """
    Logs payment tender arrays (Cash, Card, UPI) against the invoice dynamically.
    Ensures total sum matches exact requirements.
    Expected format: [{"mode": "cash", "amount": 100}, {"mode": "card", "amount": 200}]
    """
    if not payment_splits:
        return
        
    total_paid = sum(float(split.get("amount", 0)) for split in payment_splits)
    
    # We allow a small epsilon for rounding if needed, but strictly matching is better
    if abs(total_paid - float(invoice.grand_total)) > 0.1:
        raise ValueError(f"Payment splits total ({total_paid}) does not match invoice grand total ({invoice.grand_total})")

    for split in payment_splits:
        Payment.objects.create(
            shop=invoice.shop,
            invoice=invoice,
            payment_mode=split.get("mode"),
            amount=split.get("amount", 0)
        )
        
    invoice.is_paid = True
    invoice.save()
