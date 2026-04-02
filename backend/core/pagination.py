"""
Custom Pagination — JewelloSoft
================================
Returns a consistent envelope for paginated responses:
{
    "status": "success",
    "count": 120,
    "next": "http://…?page=3",
    "previous": "http://…?page=1",
    "data": [ … ]
}
"""
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardPagination(PageNumberPagination):
    """Default pagination used across all ViewSets."""
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 200

    def get_paginated_response(self, data):
        return Response({
            "status": "success",
            "count": self.page.paginator.count,
            "next": self.get_next_link(),
            "previous": self.get_previous_link(),
            "data": data,
        })

    def get_paginated_response_schema(self, schema):
        """OpenAPI schema override for documentation."""
        return {
            "type": "object",
            "properties": {
                "status": {"type": "string", "example": "success"},
                "count": {"type": "integer"},
                "next": {"type": "string", "nullable": True},
                "previous": {"type": "string", "nullable": True},
                "data": schema,
            },
        }
