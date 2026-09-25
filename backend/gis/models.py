import uuid
from django.db import models
from django.utils import timezone


class SpatialBoundary(models.Model):
    """
    Stores administrative and municipal boundary geometries in GeoJSON format.
    """
    BOUNDARY_TYPES = [
        ('STATE', 'State Boundary'),
        ('DISTRICT', 'District Boundary'),
        ('MUNICIPALITY', 'Municipal Boundary'),
        ('ZONE', 'Zone Boundary'),
        ('WARD', 'Ward Boundary'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=128)
    boundary_type = models.CharField(max_length=32, choices=BOUNDARY_TYPES, default='WARD')
    geojson_data = models.JSONField(default=dict)
    center_lat = models.FloatField()
    center_lng = models.FloatField()
    zoom_level = models.IntegerField(default=13)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = "Spatial Boundary"
        verbose_name_plural = "Spatial Boundaries"

    def __str__(self):
        return f"{self.name} ({self.boundary_type})"


class HotspotCluster(models.Model):
    """
    Automatically detected civic failure hotspot cluster with spatial density metrics.
    Correlates recurring citizen complaints and synthesizes predictive capital expenditure (CapEx) solutions.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    department_category = models.CharField(max_length=150, null=True, blank=True, db_index=True)
    cluster_center_lat = models.FloatField(db_index=True)
    cluster_center_lng = models.FloatField(db_index=True)
    radius_meters = models.FloatField(default=300.0)
    reports_count = models.PositiveIntegerField(default=1)
    severity_score = models.FloatField(default=0.0)  # 0.0 to 100.0
    unresolved_count = models.PositiveIntegerField(default=0)
    reopened_count = models.PositiveIntegerField(default=0)

    # Preventive Capital Expenditure (CapEx) Engineering Recommendation
    capex_recommendation_title = models.CharField(max_length=255, null=True, blank=True)
    capex_estimated_budget_inr = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    capex_recommendation_description = models.TextField(null=True, blank=True)

    complaints = models.ManyToManyField('complaints.Complaint', related_name='hotspot_clusters', blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    detected_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-severity_score']
        verbose_name = "Civic Hotspot Cluster"
        verbose_name_plural = "Civic Hotspot Clusters"

    def __str__(self):
        return f"Hotspot: {self.name} ({self.reports_count} reports, Score: {self.severity_score})"
