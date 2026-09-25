from django.contrib import admin
from django.urls import path, include
from django.views.generic.base import RedirectView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('admin', RedirectView.as_view(url='/admin/', permanent=False)),
    path('admin-console/', RedirectView.as_view(url='/admin/', permanent=False)),
    path('admin-console', RedirectView.as_view(url='/admin/', permanent=False)),
    path('api/auth/', include('accounts.urls')),
    path('api/complaints/', include('complaints.urls')),
    path('api/reports/', include('complaints.urls')),
    path('api/audit/', include('audit.urls')),
    path('api/gis/', include('gis.urls')),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

admin.site.site_header = "National Digital Public Infrastructure - Citizen Grievance Portal"
admin.site.site_title = "DPIP Citizen Module Admin"
admin.site.index_title = "Citizen Services & Grievance Redressal Administration"
