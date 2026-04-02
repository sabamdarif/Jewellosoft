from django.urls import path
from .views import DashboardStatsView, GlobalSearchView, ApplicationHealthView

urlpatterns = [
    path('health/', ApplicationHealthView.as_view(), name='app-health'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('search/', GlobalSearchView.as_view(), name='global-search'),
]

