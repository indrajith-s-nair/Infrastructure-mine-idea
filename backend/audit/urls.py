from django.urls import path
from .views import AuditEventListView, AuditChainVerifyView, ComplaintAuditTrailView

urlpatterns = [
    path('', AuditEventListView.as_view(), name='audit-list'),
    path('verify/', AuditChainVerifyView.as_view(), name='audit-verify'),
    path('verify', AuditChainVerifyView.as_view(), name='audit-verify-noslash'),
    path('complaint/<str:tracking_code>/', ComplaintAuditTrailView.as_view(), name='audit-complaint-trail'),
    path('complaint/<str:tracking_code>', ComplaintAuditTrailView.as_view(), name='audit-complaint-trail-noslash'),
]
