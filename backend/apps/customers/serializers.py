from rest_framework import serializers
from .models import Customer
from apps.accounts.serializers import ShopSerializer

class CustomerSerializer(serializers.ModelSerializer):
    total_bills = serializers.IntegerField(read_only=True, default=0)
    total_spent = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True, default=0)
    last_visit = serializers.DateTimeField(read_only=True, format="%d %b %Y")
    customer_type = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = '__all__'
        extra_kwargs = {
            "customer_code": {"required": False, "allow_blank": True}
        }

    def get_customer_type(self, obj):
        # Determine based on total_spent logic or total_bills. 
        # For instance: > 5 bills or spent > 500,000 = VIP
        bills = getattr(obj, 'total_bills', 0) or 0
        spent = getattr(obj, 'total_spent', 0) or 0
        
        if bills >= 10 or spent >= 500000:
            return "VIP"
        elif bills >= 2 or spent >= 50000:
            return "Regular"
        else:
            return "Walk-in"
