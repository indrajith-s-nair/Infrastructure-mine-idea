from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import HotspotCluster, SpatialBoundary
from .clustering import GISClusteringService


class HotspotClusterListView(APIView):
    """
    Returns detected civic failure hotspots with recurrence density and preventive CapEx budgets.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        clusters = HotspotCluster.objects.filter(is_active=True).order_by('-severity_score')

        # Auto-run if empty
        if not clusters.exists():
            clusters = GISClusteringService.run_predictive_clustering()

        data = []
        for cl in clusters:
            data.append({
                'id': str(cl.id),
                'name': cl.name,
                'department_category': cl.department_category,
                'center_lat': cl.cluster_center_lat,
                'center_lng': cl.cluster_center_lng,
                'radius_meters': cl.radius_meters,
                'reports_count': cl.reports_count,
                'severity_score': cl.severity_score,
                'unresolved_count': cl.unresolved_count,
                'reopened_count': cl.reopened_count,
                'capex_recommendation': {
                    'title': cl.capex_recommendation_title,
                    'estimated_budget_inr': float(cl.capex_estimated_budget_inr),
                    'description': cl.capex_recommendation_description,
                },
                'complaints': [
                    {
                        'tracking_code': c.tracking_code,
                        'status': c.status,
                        'severity': c.ai_severity_score,
                        'address': c.address,
                        'is_reopened': c.is_reopened,
                        'created_at': c.created_at.isoformat(),
                    }
                    for c in cl.complaints.all()[:10]
                ],
                'detected_at': cl.detected_at.isoformat(),
            })

        return Response({
            'count': len(data),
            'clusters': data
        }, status=status.HTTP_200_OK)


class HotspotClusterRefreshView(APIView):
    """
    Forces an execution of spatial clustering algorithm and updates hotspot records.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        radius = request.data.get('radius_meters', 350.0)
        min_complaints = request.data.get('min_complaints', 2)
        try:
            radius = float(radius)
            min_complaints = int(min_complaints)
        except (ValueError, TypeError):
            radius = 350.0
            min_complaints = 2

        clusters = GISClusteringService.run_predictive_clustering(
            radius_meters=radius,
            min_complaints=min_complaints
        )
        return Response({
            'message': f'Spatial clustering executed successfully. {len(clusters)} hotspots identified.',
            'clusters_count': len(clusters)
        }, status=status.HTTP_200_OK)


class NearbyComplaintsView(APIView):
    """
    Locates complaints within a given radius of a latitude/longitude point.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        radius = request.query_params.get('radius', 500.0)

        if not lat or not lng:
            return Response({'error': 'lat and lng parameters are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            lat = float(lat)
            lng = float(lng)
            radius = float(radius)
        except (ValueError, TypeError):
            return Response({'error': 'Invalid numeric coordinates or radius.'}, status=status.HTTP_400_BAD_REQUEST)

        results = GISClusteringService.find_nearby_complaints(lat, lng, radius)
        return Response({
            'center': {'latitude': lat, 'longitude': lng},
            'radius_meters': radius,
            'count': len(results),
            'results': results
        }, status=status.HTTP_200_OK)


class GeoJSONFeatureCollectionView(APIView):
    """
    Exports all geotagged complaints in GeoJSON format.
    Automatically applies 50-80m coordinate fuzzing for public/anonymous views
    to protect citizen home address privacy while providing precise coordinates to on-duty officers.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        user = request.user
        is_official = user.is_authenticated and (user.is_staff or getattr(user, 'role', '') in ['OFFICER', 'CENTRAL_DESK', 'ADMIN'] or hasattr(user, 'officer_profile'))
        fuzz = not is_official
        fc = GISClusteringService.build_geojson_feature_collection(fuzz_for_public=fuzz)
        return Response(fc, status=status.HTTP_200_OK)
