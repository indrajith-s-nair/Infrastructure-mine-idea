import hashlib
import logging
import math
from typing import List, Dict, Any
from django.db import transaction
from django.utils import timezone
from complaints.models import Complaint
from .models import HotspotCluster

logger = logging.getLogger(__name__)


class GISClusteringService:
    """
    Predictive Spatial Deterioration & Infrastructure Failure Clustering Service.
    Aggregates recurring localized civic failures into chronic deterioration hotspots
    and auto-synthesizes municipal capital expenditure (CapEx) planning recommendations.
    Pure-Python mathematical implementation, database agnostic (works on SQLite, Postgres, Spanner).
    """

    @staticmethod
    def fuzz_coordinates(lat: float, lon: float, seed_str: str, offset_meters: float = 65.0) -> tuple[float, float]:
        """
        Applies a deterministic ~50-80m privacy offset to prevent revealing exact citizen residences
        on public tracking or unauthenticated GeoJSON maps, while retaining corridor accuracy.
        """
        h = int(hashlib.md5(seed_str.encode('utf-8')).hexdigest()[:8], 16)
        angle = (h % 360) * (math.pi / 180.0)
        dist = offset_meters + (h % 25)
        d_lat = (dist * math.cos(angle)) / 111320.0
        cos_lat = math.cos(math.radians(lat))
        d_lon = (dist * math.sin(angle)) / (111320.0 * (cos_lat if abs(cos_lat) > 0.001 else 1.0))
        return (round(lat + d_lat, 5), round(lon + d_lon, 5))

    @staticmethod
    def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculates great-circle distance between two geographic coordinates in meters."""
        r = 6371000.0  # Earth radius in meters
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)

        a = (math.sin(delta_phi / 2.0) ** 2 +
             math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return r * c

    @classmethod
    def generate_capex_recommendation(cls, cluster_name: str, category_name: str, reports_count: int, severity_score: float) -> Dict[str, Any]:
        """
        Synthesizes an authoritative engineering CapEx solution based on cluster category and frequency.
        """
        cat = (category_name or "").lower()

        if any(w in cat for w in ['road', 'pothole', 'street', 'footpath', 'traffic', 'pavement']):
            action_title = f"Comprehensive Bituminous Resurfacing & Road Milling ({cluster_name})"
            est_budget = 1500000.00
            dept_code = "PWD / ROADS"
            description = (
                f"Repeated roadway deterioration identified across {reports_count} complaints. "
                f"Localized patchwork repair is cost-ineffective. Full-depth bituminous resurfacing, "
                f"aggregate base reinforcement, and anti-skid sealant recommended."
            )
        elif any(w in cat for w in ['water', 'pipe', 'leak', 'supply', 'tap', 'pressure']):
            action_title = f"Underground Ductile Iron (DI) Distribution Trunk Replacement ({cluster_name})"
            est_budget = 2800000.00
            dept_code = "WATER & SEWERAGE"
            description = (
                f"Chronic pipeline pressure breaches and leakage detected ({reports_count} incidents). "
                f"Replace aged distribution pipeline with ductile iron (DI) pipe and install automated "
                f"telemetric pressure valves to prevent recurrent supply disruptions."
            )
        elif any(w in cat for w in ['drain', 'sewer', 'flood', 'sewage', 'culvert', 'waterlogging']):
            action_title = f"Stormwater Drainage & Reinforced Culvert Upgrade ({cluster_name})"
            est_budget = 3500000.00
            dept_code = "DRAINAGE / FLOOD MITIGATION"
            description = (
                f"High-frequency drainage stagnation ({reports_count} incidents). "
                f"Excavate and reinforce reinforced-concrete stormwater culvert with silt trap interception "
                f"and high-volume submersible drainage pump integration."
            )
        elif any(w in cat for w in ['garbage', 'waste', 'dump', 'sanitation', 'litter', 'trash']):
            action_title = f"Smart Mechanized Compactor Transfer Station Deployment ({cluster_name})"
            est_budget = 850000.00
            dept_code = "SOLID WASTE MANAGEMENT"
            description = (
                f"Chronic municipal solid waste dumping cluster detected with severity score {severity_score}/100. "
                f"Deploy an enclosed solar-powered mechanized compactor with twice-daily GPS-monitored clearance."
            )
        elif any(w in cat for w in ['light', 'lamp', 'pole', 'electric', 'power', 'cable']):
            action_title = f"Smart LED Streetlight Grid Replacement & Centralized Feeder Control ({cluster_name})"
            est_budget = 1200000.00
            dept_code = "ELECTRICAL & ENERGY"
            description = (
                f"Multiple recurring streetlight failures ({reports_count} incidents). "
                f"Install energy-efficient LED luminaires with centralized photocell feeder controls and underground armoring."
            )
        else:
            action_title = f"Corridor Civic Infrastructure Modernization Project ({cluster_name})"
            est_budget = 1000000.00
            dept_code = "MUNICIPAL ENGINEERING"
            description = (
                f"Capital civic intervention recommended to permanently resolve {reports_count} recurring grievances "
                f"and eliminate structural deterioration (Severity {severity_score}/100)."
            )

        return {
            "title": action_title,
            "budget": est_budget,
            "dept_code": dept_code,
            "description": description
        }

    @classmethod
    def run_predictive_clustering(cls, radius_meters: float = 350.0, min_complaints: int = 2) -> List[HotspotCluster]:
        """
        Scans all geotagged complaints, performs proximity clustering,
        and computes failure severity and CapEx investment recommendations.
        """
        complaints = list(Complaint.objects.filter(
            latitude__isnull=False,
            longitude__isnull=False
        ).order_by('-created_at'))

        if len(complaints) < min_complaints:
            logger.info("Insufficient geotagged complaints for clustering.")
            return list(HotspotCluster.objects.filter(is_active=True))

        clusters_created = []
        visited_ids = set()

        # High-Performance Spatial Grid Index:
        # Cell size ~ radius_meters in geographic degrees (~350m / 111320m ~= 0.00315 deg)
        cell_size = max(0.001, radius_meters / 111320.0)
        grid: Dict[tuple, List[Complaint]] = {}
        for comp in complaints:
            gx = int(float(comp.latitude) / cell_size)
            gy = int(float(comp.longitude) / cell_size)
            grid.setdefault((gx, gy), []).append(comp)

        for i, comp in enumerate(complaints):
            if comp.id in visited_ids:
                continue

            cluster_members = [comp]
            visited_ids.add(comp.id)
            c_lat = float(comp.latitude)
            c_lng = float(comp.longitude)

            gx = int(c_lat / cell_size)
            gy = int(c_lng / cell_size)

            # Check candidate points only in current cell and 8 adjacent neighbor cells (O(N) vs O(N^2))
            candidate_pool = []
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    neighbor_cell = (gx + dx, gy + dy)
                    if neighbor_cell in grid:
                        candidate_pool.extend(grid[neighbor_cell])

            for other in candidate_pool:
                if other.id in visited_ids or other.id == comp.id:
                    continue

                o_lat = float(other.latitude)
                o_lng = float(other.longitude)
                dist = cls.haversine_distance_meters(c_lat, c_lng, o_lat, o_lng)
                if dist <= radius_meters:
                    cluster_members.append(other)
                    visited_ids.add(other.id)

            if len(cluster_members) >= min_complaints:
                avg_lat = sum(float(c.latitude) for c in cluster_members) / len(cluster_members)
                avg_lng = sum(float(c.longitude) for c in cluster_members) / len(cluster_members)

                total_count = len(cluster_members)
                unresolved_count = sum(1 for c in cluster_members if c.status in [Complaint.Status.PENDING, Complaint.Status.IN_PROGRESS])
                critical_count = sum(1 for c in cluster_members if getattr(c, 'urgency_level', 'LOW') in ['CRITICAL', 'HIGH'] or (c.ai_severity_score or 0) >= 65)
                reopened_count = sum(1 for c in cluster_members if getattr(c, 'is_reopened', False))

                # Dynamic Severity Calculation (0.0 to 100.0)
                severity = min(100.0, (unresolved_count * 12.0) + (critical_count * 10.0) + (reopened_count * 15.0) + (total_count * 4.0))

                # Determine dominant department category
                cat_counts: Dict[str, int] = {}
                for c in cluster_members:
                    cat = c.department_category or "Infrastructure"
                    cat_counts[cat] = cat_counts.get(cat, 0) + 1
                dominant_cat = max(cat_counts.items(), key=lambda x: x[1])[0]

                # Representative address / landmark
                addr_sample = cluster_members[0].address or "Urban Corridor"
                short_loc = addr_sample.split(',')[0].strip()[:35]
                cluster_name = f"{dominant_cat} Failure Zone - {short_loc}"

                capex_rec = cls.generate_capex_recommendation(
                    cluster_name=short_loc,
                    category_name=dominant_cat,
                    reports_count=total_count,
                    severity_score=round(severity, 1)
                )

                with transaction.atomic():
                    cluster_obj, created = HotspotCluster.objects.update_or_create(
                        name=cluster_name,
                        defaults={
                            "department_category": dominant_cat,
                            "cluster_center_lat": round(avg_lat, 6),
                            "cluster_center_lng": round(avg_lng, 6),
                            "radius_meters": radius_meters,
                            "reports_count": total_count,
                            "severity_score": round(severity, 1),
                            "unresolved_count": unresolved_count,
                            "reopened_count": reopened_count,
                            "capex_recommendation_title": capex_rec['title'],
                            "capex_estimated_budget_inr": capex_rec['budget'],
                            "capex_recommendation_description": capex_rec['description'],
                            "is_active": True,
                            "detected_at": timezone.now()
                        }
                    )
                    cluster_obj.complaints.set(cluster_members)
                    clusters_created.append(cluster_obj)

        logger.info(f"Predictive GIS Clustering complete: {len(clusters_created)} active failure hotspots.")
        return clusters_created

    @classmethod
    def find_nearby_complaints(cls, latitude: float, longitude: float, radius_meters: float = 500.0) -> List[Dict[str, Any]]:
        """
        Locates complaints within a given radius in meters.
        """
        lat_delta = radius_meters / 111320.0
        lon_delta = radius_meters / (111320.0 * math.cos(math.radians(latitude)))

        candidates = Complaint.objects.filter(
            latitude__gte=latitude - lat_delta,
            latitude__lte=latitude + lat_delta,
            longitude__gte=longitude - lon_delta,
            longitude__lte=longitude + lon_delta
        )

        results = []
        for c in candidates:
            dist = cls.haversine_distance_meters(latitude, longitude, float(c.latitude), float(c.longitude))
            if dist <= radius_meters:
                results.append({
                    'tracking_code': c.tracking_code,
                    'description': c.description[:100],
                    'status': c.status,
                    'severity': c.ai_severity_score,
                    'urgency': c.urgency_level,
                    'category': c.department_category,
                    'distance_meters': round(dist, 1),
                    'latitude': float(c.latitude),
                    'longitude': float(c.longitude),
                    'address': c.address,
                    'created_at': c.created_at.isoformat()
                })

        return sorted(results, key=lambda x: x['distance_meters'])

    @classmethod
    def build_geojson_feature_collection(cls, fuzz_for_public: bool = False) -> Dict[str, Any]:
        """
        Produces standard GeoJSON FeatureCollection for Mapbox / Leaflet / OpenStreetMap.
        If fuzz_for_public is True, coordinates are offset by ~50-80m to protect citizen residence privacy.
        """
        complaints = Complaint.objects.filter(
            latitude__isnull=False,
            longitude__isnull=False
        ).select_related('assigned_officer')

        features = []
        for c in complaints:
            lat = float(c.latitude)
            lng = float(c.longitude)
            if fuzz_for_public:
                lat, lng = cls.fuzz_coordinates(lat, lng, seed_str=c.tracking_code)

            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [lng, lat]
                },
                "properties": {
                    "tracking_code": c.tracking_code,
                    "status": c.status,
                    "category": c.department_category or "General",
                    "severity": c.ai_severity_score or 0.0,
                    "urgency": c.urgency_level,
                    "address": c.address,
                    "is_reopened": c.is_reopened,
                    "created_at": c.created_at.isoformat()
                }
            })

        return {
            "type": "FeatureCollection",
            "features": features
        }
