from django.urls import path
from .views import (
    ComplaintCreateView,
    ComplaintTrackView,
    MyComplaintsListView,
    OfficerInboxView,
    ComplaintReassignView,
    ComplaintAcceptView,
    ComplaintDeclineView,
    ComplaintResolveView,
    ComplaintStatsView,
    ComplaintReopenView,
    CentralDeskInboxView,
    CentralDeskDispatchView,
    CivicFeedbackListCreateView,
)
from .transcribe_view import TranscribeAudioView

urlpatterns = [
    path('transcribe/', TranscribeAudioView.as_view(), name='complaint-transcribe'),
    path('transcribe', TranscribeAudioView.as_view(), name='complaint-transcribe-noslash'),
    # Citizen Grievance Endpoints
    path('', ComplaintCreateView.as_view(), name='complaint-create'),
    path('create/', ComplaintCreateView.as_view(), name='complaint-create-alias'),
    path('create', ComplaintCreateView.as_view(), name='complaint-create-alias-noslash'),
    path('track/<str:tracking_code>/', ComplaintTrackView.as_view(), name='complaint-track'),
    path('track/<str:tracking_code>', ComplaintTrackView.as_view(), name='complaint-track-noslash'),
    path('track/<str:tracking_code>/reopen/', ComplaintReopenView.as_view(), name='complaint-track-reopen'),
    path('track/<str:tracking_code>/reopen', ComplaintReopenView.as_view(), name='complaint-track-reopen-noslash'),
    path('<str:tracking_code>/reopen/', ComplaintReopenView.as_view(), name='complaint-reopen'),
    path('<str:tracking_code>/reopen', ComplaintReopenView.as_view(), name='complaint-reopen-noslash'),
    path('my-complaints/', MyComplaintsListView.as_view(), name='complaint-my-list'),
    path('my-complaints', MyComplaintsListView.as_view(), name='complaint-my-list-noslash'),
    path('stats/', ComplaintStatsView.as_view(), name='complaint-stats'),
    path('stats', ComplaintStatsView.as_view(), name='complaint-stats-noslash'),

    # Civic Survey & Public Infrastructure Feedback
    path('feedback/', CivicFeedbackListCreateView.as_view(), name='civic-feedback-list-create'),
    path('feedback', CivicFeedbackListCreateView.as_view(), name='civic-feedback-list-create-noslash'),

    # Phase 2: Frontline Officer Endpoints
    path('officer-inbox/', OfficerInboxView.as_view(), name='complaint-officer-inbox'),
    path('officer-inbox', OfficerInboxView.as_view(), name='complaint-officer-inbox-noslash'),
    path('officer/inbox/', OfficerInboxView.as_view(), name='complaint-officer-inbox-alias'),
    path('officer/inbox', OfficerInboxView.as_view(), name='complaint-officer-inbox-alias-noslash'),
    path('<str:tracking_code>/reassign/', ComplaintReassignView.as_view(), name='complaint-reassign'),
    path('<str:tracking_code>/reassign', ComplaintReassignView.as_view(), name='complaint-reassign-noslash'),
    path('<str:tracking_code>/accept/', ComplaintAcceptView.as_view(), name='complaint-accept'),
    path('<str:tracking_code>/accept', ComplaintAcceptView.as_view(), name='complaint-accept-noslash'),
    path('<str:tracking_code>/decline/', ComplaintDeclineView.as_view(), name='complaint-decline'),
    path('<str:tracking_code>/decline', ComplaintDeclineView.as_view(), name='complaint-decline-noslash'),
    path('<str:tracking_code>/resolve/', ComplaintResolveView.as_view(), name='complaint-resolve'),
    path('<str:tracking_code>/resolve', ComplaintResolveView.as_view(), name='complaint-resolve-noslash'),
    path('officer/<str:tracking_code>/reassign/', ComplaintReassignView.as_view(), name='complaint-officer-reassign'),
    path('officer/<str:tracking_code>/reassign', ComplaintReassignView.as_view(), name='complaint-officer-reassign-noslash'),
    path('officer/<str:tracking_code>/accept/', ComplaintAcceptView.as_view(), name='complaint-officer-accept'),
    path('officer/<str:tracking_code>/accept', ComplaintAcceptView.as_view(), name='complaint-officer-accept-noslash'),
    path('officer/<str:tracking_code>/decline/', ComplaintDeclineView.as_view(), name='complaint-officer-decline'),
    path('officer/<str:tracking_code>/decline', ComplaintDeclineView.as_view(), name='complaint-officer-decline-noslash'),
    path('officer/<str:tracking_code>/resolve/', ComplaintResolveView.as_view(), name='complaint-officer-resolve'),
    path('officer/<str:tracking_code>/resolve', ComplaintResolveView.as_view(), name='complaint-officer-resolve-noslash'),

    # Phase 3: Central Triage Desk (Human-in-the-Loop) Endpoints
    path('central-desk/inbox/', CentralDeskInboxView.as_view(), name='central-desk-inbox'),
    path('central-desk/inbox', CentralDeskInboxView.as_view(), name='central-desk-inbox-noslash'),
    path('central-desk/<str:tracking_code>/dispatch/', CentralDeskDispatchView.as_view(), name='central-desk-dispatch'),
    path('central-desk/<str:tracking_code>/dispatch', CentralDeskDispatchView.as_view(), name='central-desk-dispatch-noslash'),
    path('<str:tracking_code>/central-desk/dispatch/', CentralDeskDispatchView.as_view(), name='central-desk-dispatch-alias'),
    path('<str:tracking_code>/central-desk/dispatch', CentralDeskDispatchView.as_view(), name='central-desk-dispatch-alias-noslash'),
]

