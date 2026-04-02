import base64
import uuid
from django.core.files.base import ContentFile
from rest_framework import serializers
from .models import Order, OrderItem, OrderImage
from django.db import transaction
import random

class OrderImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderImage
        fields = ('id', 'image')

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = '__all__'
        read_only_fields = ('order',)

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    images = OrderImageSerializer(many=True, read_only=True)
    design_images = serializers.ListField(
        child=serializers.CharField(), write_only=True, required=False
    )
    customer_detail = serializers.SerializerMethodField()
    order_no = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Order
        fields = '__all__'
        
    def get_customer_detail(self, obj):
        if obj.customer:
            return {
                "name": obj.customer.name,
                "phone": obj.customer.phone,
                "address": obj.customer.address
            }
        return None

    def validate(self, data):
        from decimal import Decimal
        # Safely round decimal fields to prevent 400 validation crash
        for field in ["cgst", "sgst", "round_off", "grand_total"]:
            if field in data and data[field] is not None:
                try:
                    data[field] = round(Decimal(str(data[field])), 2)
                except:
                    pass
        return data

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        design_images_data = validated_data.pop('design_images', [])
        
        # Auto-generate order_no if not provided
        order_no = validated_data.get('order_no')
        if not order_no:
            prefix = "ORD-INV" if validated_data.get('order_type') == "invoice" else "ORD-EST"
            rnd = random.randint(1000, 9999)
            validated_data['order_no'] = f"{prefix}-2026-{rnd}" # Assuming year 2026 for now

        order = Order.objects.create(**validated_data)
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
            
        for b64 in design_images_data:
            if isinstance(b64, str) and b64.startswith('data:image'):
                format_info, imgstr = b64.split(';base64,')
                ext = format_info.split('/')[-1]
                img_data = ContentFile(base64.b64decode(imgstr), name=f"{uuid.uuid4().hex[:10]}.{ext}")
                OrderImage.objects.create(order=order, image=img_data)

        return order
