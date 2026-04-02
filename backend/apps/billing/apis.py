# DRF views/endpoints without business logic
from rest_framework.views import APIView
from rest_framework.response import Response
from .services.billing_engine import BillingEngine


class BillingPreviewAPI(APIView):

    def post(self, request):
        engine = BillingEngine(
            items=request.data.get("items"),
            rate_10gm=request.data.get("rate_10gm"),
            making_per_gm=request.data.get("making_per_gm"),
            extra=request.data.get("extra")
        )

        result = engine.calculate()

        return Response(result)