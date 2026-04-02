from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Shop
from .serializers import ShopSerializer

class ShopViewSet(viewsets.ModelViewSet):
    queryset = Shop.objects.all()
    serializer_class = ShopSerializer
    permission_classes = [AllowAny]

    @action(detail=False, methods=['get', 'put', 'patch'])
    def current(self, request):
        shop = Shop.objects.first()
        if not shop:
            shop = Shop.objects.create(
                name="New Shop",
                owner_name="Owner",
                phone="0000000000",
                address="Address"
            )
        
        if request.method == 'GET':
            serializer = self.get_serializer(shop)
            return Response(serializer.data)
        
        serializer = self.get_serializer(shop, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
