from django.urls import path
from .views import (
    HotspotClusterListView,
    HotspotClusterRefreshView,
    NearbyComplaintsView,
    GeoJSONFeatureCollectionView,
)

urlpatterns = [
    path('hotspots/', HotspotClusterListView.as_view(), name='gis-hotspots'),
    path('hotspots', HotspotClusterListView.as_view(), name='gis-hotspots-noslash'),
    path('hotspots/refresh/', HotspotClusterRefreshView.as_view(), name='gis-hotspots-refresh'),
    path('hotspots/refresh', HotspotClusterRefreshView.as_view(), name='gis-hotspots-refresh-noslash'),
    path('nearby/', NearbyComplaintsView.as_view(), name='gis-nearby'),
    path('nearby', NearbyComplaintsView.as_view(), name='gis-nearby-noslash'),
    path('geojson/', GeoJSONFeatureCollectionView.as_view(), name='gis-geojson'),
    path('geojson', GeoJSONFeatureCollectionView.as_view(), name='gis-geojson-noslash'),
]
