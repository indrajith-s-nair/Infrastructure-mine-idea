'use client';

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Flame,
  AlertTriangle,
  Building,
  DollarSign,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  Layers,
  CheckCircle,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { api, HotspotClusterItem } from '@/lib/api';

export const GISHotspotMap: React.FC = () => {
  const [clusters, setClusters] = useState<HotspotClusterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<HotspotClusterItem | null>(null);
  const [expandedClusterId, setExpandedClusterId] = useState<string | null>(null);

  const fetchClusters = () => {
    setLoading(true);
    api.gis
      .getHotspots()
      .then((res) => {
        setClusters(res.clusters || []);
        if (res.clusters && res.clusters.length > 0 && !selectedCluster) {
          setSelectedCluster(res.clusters[0]);
        }
      })
      .catch((err) => console.error('Failed to load GIS hotspots:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchClusters();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshMsg(null);
    try {
      const res = await api.gis.refreshHotspots();
      setRefreshMsg(res.message);
      fetchClusters();
    } catch (err: any) {
      setRefreshMsg(err.message || 'Spatial clustering failed.');
    } finally {
      setRefreshing(false);
    }
  };

  const totalBudget = clusters.reduce(
    (sum, c) => sum + (c.capex_recommendation?.estimated_budget_inr || 0),
    0
  );

  const totalComplaintsInHotspots = clusters.reduce(
    (sum, c) => sum + c.reports_count,
    0
  );

  if (loading) {
    return (
      <div className="p-16 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Computing Spatial Proximity & Failure Clusters (Haversine Grid)...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Stat Cards */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                GEOSPATIAL INTELLIGENCE & CAPEX
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                HAVERSINE ALGORITHM
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Civic Infrastructure Failure Hotspots
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
              Identifies chronic breakdown zones by clustering recurring complaints within 350-meter corridors.
              Synthesizes long-term engineering solutions to replace repetitive patchwork repairs with budgeted municipal CapEx investments.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-md transition-all self-start sm:self-auto shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Re-Clustering...' : 'Re-Run Spatial Clustering'}</span>
          </button>
        </div>

        {refreshMsg && (
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-200 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{refreshMsg}</span>
          </div>
        )}

        {/* Analytics KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Detected Hotspots</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{clusters.length}</p>
            <p className="text-[10px] text-slate-400">High-density failure zones</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Clustered Incidents</p>
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{totalComplaintsInHotspots}</p>
            <p className="text-[10px] text-slate-400">Total localized complaints</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Peak Severity Score</p>
            <p className="text-2xl font-black text-red-600 dark:text-red-400">
              {clusters.length > 0 ? Math.max(...clusters.map((c) => c.severity_score)) : 0}/100
            </p>
            <p className="text-[10px] text-slate-400">Critical recurrence velocity</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Recommended CapEx</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              ₹{(totalBudget / 100000).toFixed(1)} L
            </p>
            <p className="text-[10px] text-slate-400">Projected municipal budget</p>
          </div>
        </div>
      </div>

      {/* Hotspots Master-Detail View */}
      {clusters.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center space-y-3">
          <MapPin className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Failure Hotspots Currently Active</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            All registered civic complaints are currently distributed without recurring geographic clustering breach.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Hotspot List */}
          <div className="lg:col-span-1 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Priority Failure Hotspots ({clusters.length})
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">Sorted by Severity</span>
            </div>

            <div className="space-y-3">
              {clusters.map((cluster) => {
                const isSelected = selectedCluster?.id === cluster.id;
                const isCritical = cluster.severity_score >= 70;
                const isHigh = cluster.severity_score >= 40 && cluster.severity_score < 70;

                return (
                  <button
                    key={cluster.id}
                    type="button"
                    onClick={() => setSelectedCluster(cluster)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 shadow-md ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 pb-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                          {cluster.department_category || 'Infrastructure'}
                        </span>
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white line-clamp-1">
                          {cluster.name}
                        </h3>
                      </div>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                          isCritical
                            ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                            : isHigh
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {cluster.severity_score}/100
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/60 font-mono">
                      <span>{cluster.reports_count} Grievances</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        ₹{(cluster.capex_recommendation.estimated_budget_inr / 100000).toFixed(1)}L Budget
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Hotspot Deep Dive & Engineering CapEx Blueprint */}
          {selectedCluster && (
            <div className="lg:col-span-2 space-y-6">
              {/* Hotspot Header */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-black px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                        {selectedCluster.department_category}
                      </span>
                      <span className="text-xs font-bold text-slate-500 font-mono">
                        Radius: {selectedCluster.radius_meters}m
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                      {selectedCluster.name}
                    </h2>
                  </div>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${selectedCluster.center_lat},${selectedCluster.center_lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-blue-500 flex items-center gap-1.5 self-start sm:self-auto shrink-0 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                    <span>View Geographic Coordinates</span>
                  </a>
                </div>

                {/* Spatial Coordinates & Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] text-slate-500">Center Latitude</p>
                    <p className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {selectedCluster.center_lat.toFixed(6)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] text-slate-500">Center Longitude</p>
                    <p className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {selectedCluster.center_lng.toFixed(6)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] text-slate-500">Unresolved Tickets</p>
                    <p className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      {selectedCluster.unresolved_count} active
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] text-slate-500">Reopened Rate</p>
                    <p className="font-mono font-bold text-red-600 dark:text-red-400">
                      {selectedCluster.reopened_count} reopened
                    </p>
                  </div>
                </div>

                {/* Severity Meter Bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-600 dark:text-slate-400">Deterioration Recurrence Score</span>
                    <span className="text-slate-900 dark:text-white font-mono">{selectedCluster.severity_score}/100</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        selectedCluster.severity_score >= 70
                          ? 'bg-red-600'
                          : selectedCluster.severity_score >= 40
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, selectedCluster.severity_score))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Preventive CapEx Engineering Blueprint */}
              <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 p-6 sm:p-8 shadow-xl space-y-4">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
                  <Building className="w-4 h-4 text-emerald-600" />
                  <span>Synthesized Preventive Capital Expenditure (CapEx) Blueprint</span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {selectedCluster.capex_recommendation.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {selectedCluster.capex_recommendation.description}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold text-slate-500">Estimated Municipal Capital Investment</p>
                    <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                      ₹{selectedCluster.capex_recommendation.estimated_budget_inr.toLocaleString('en-IN')} INR
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 self-start sm:self-auto">
                    Recommended for Municipal Budget Allocation
                  </span>
                </div>
              </div>

              {/* Clustered Grievances Table */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Correlated Citizen Grievances ({selectedCluster.complaints.length})
                  </h3>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedCluster.complaints.map((c) => (
                    <div key={c.tracking_code} className="py-3 flex items-center justify-between gap-4 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                            {c.tracking_code}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.status === 'RESOLVED'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {c.status}
                          </span>
                          {c.is_reopened && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                              REOPENED
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px] truncate max-w-md">
                          {c.address}
                        </p>
                      </div>

                      <a
                        href={`/complaints/track/${c.tracking_code}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-blue-600 hover:underline shrink-0"
                      >
                        Inspect
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
