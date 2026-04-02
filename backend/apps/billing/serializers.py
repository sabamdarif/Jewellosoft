from rest_framework import serializers
from .models import Invoice, Estimate, BillingItem

class BillingItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillingItem
        fields = '__all__'

from apps.customers.models import Customer
class BasicCustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['id', 'name', 'phone', 'address']

class InvoiceSerializer(serializers.ModelSerializer):
    items = BillingItemSerializer(many=True, read_only=True)
    customer_detail = BasicCustomerSerializer(source='customer', read_only=True)
    
    class Meta:
        model = Invoice
        fields = '__all__'

    def validate(self, data):
        from decimal import Decimal
        for field in ["cgst", "sgst", "round_off", "grand_total"]:
            if field in data and data[field] is not None:
                try: data[field] = round(Decimal(str(data[field])), 2)
                except: pass
        return data

class EstimateSerializer(serializers.ModelSerializer):
    items = BillingItemSerializer(many=True, read_only=True)
    customer_detail = BasicCustomerSerializer(source='customer', read_only=True)

    class Meta:
        model = Estimate
        fields = '__all__'

    def validate(self, data):
        from decimal import Decimal
        for field in ["cgst", "sgst", "round_off", "grand_total"]:
            if field in data and data[field] is not None:
                try: data[field] = round(Decimal(str(data[field])), 2)
                except: pass
        return data
