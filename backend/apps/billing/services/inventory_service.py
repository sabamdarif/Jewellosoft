from django.db import transaction
from apps.inventory.models import ProductInventory

@transaction.atomic
def deduct_inventory(inventory_ids):
    """
    Uses select_for_update() to prevent double selling of exact SKUs/HUIDs.
    Mark as Sold iff currently Available.
    """
    if not inventory_ids:
        return
        
    products = ProductInventory.objects.select_for_update().filter(id__in=inventory_ids)
    
    if len(products) != len(inventory_ids):
        raise ValueError("One or more inventory items could not be found.")

    for product in products:
        if product.status != "available":
            raise ValueError(f"Product {product.name} ({product.barcode}) is already sold or unavailable.")
        
        product.status = "sold"
        product.save()

@transaction.atomic
def return_inventory(inventory_ids):
    """
    Reverts Sold inventory back to Available.
    """
    if not inventory_ids:
        return
        
    products = ProductInventory.objects.select_for_update().filter(id__in=inventory_ids)
    for product in products:
        product.status = "available"
        product.save()
