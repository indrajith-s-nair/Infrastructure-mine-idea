'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ComplaintData } from '@/lib/api';
import {
  MapPin,
  ExternalLink,
  Maximize2,
  Minimize2,
  AlertTriangle,
  Flame,
  Layers,
  Info,
  Clock,
  Navigation,
} from 'lucide-react';

interface OfficerMapFeedProps {
  complaints: ComplaintData[];
  onSelectComplaint?: (complaint: ComplaintData) => void;
  officerJurisdiction?: string;
}

export const OfficerMapFeed: React.FC<OfficerMapFeedProps> = ({
  complaints,
  onSelectComplaint,
  officerJurisdiction = 'Jurisdiction Area',
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activePinCount, setActivePinCount] = useState(0);
  const [isMapReady, setIsMapReady] = useState(false);

  // Filter only PENDING and IN_PROGRESS complaints with coordinates
  const activeComplaints = complaints.filter(
    (c) =>
      (c.status === 'PENDING' || c.status === 'IN_PROGRESS') &&
      c.latitude !== null &&
      c.longitude !== null
  );

  useEffect(() => {
    setActivePinCount(activeComplaints.length);
  }, [activeComplaints]);

  // Initialize and update Leaflet
  useEffect(() => {
    let isMounted = true;

    const initOrUpdateMap = async () => {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      if (!isMounted || !mapContainerRef.current) return;

      // Create map if not exists
      if (!mapInstanceRef.current) {
        const defaultCenter: [number, number] = activeComplaints.length > 0
          ? [activeComplaints[0].latitude!, activeComplaints[0].longitude!]
          : [28.6139, 77.2090];

        const map = L.map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: 13,
          zoomControl: true,
          scrollWheelZoom: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        markersLayerRef.current = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;
        setIsMapReady(true);
      }

      const map = mapInstanceRef.current;
      const markersLayer = markersLayerRef.current;
      if (!markersLayer || !map) return;

      markersLayer.clearLayers();

      const bounds = L.latLngBounds([]);

      activeComplaints.forEach((c) => {
        const lat = c.latitude!;
        const lng = c.longitude!;
        bounds.extend([lat, lng]);

        // Severity Color Code
        const score = c.ai_severity_score ?? 50;
        let pinColor = '#22c55e'; // Green (Low)
        let pinGradient = 'linear-gradient(135deg, #22c55e, #15803d)';
        let badgeBg = '#dcfce7';
        let badgeText = '#166534';
        let pulseClass = '';

        if (score >= 85) {
          pinColor = '#ef4444'; // Red (Critical)
          pinGradient = 'linear-gradient(135deg, #ef4444, #991b1b)';
          badgeBg = '#fee2e2';
          badgeText = '#991b1b';
          pulseClass = 'animate-ping';
        } else if (score >= 65) {
          pinColor = '#f97316'; // Orange (High)
          pinGradient = 'linear-gradient(135deg, #f97316, #c2410c)';
          badgeBg = '#ffedd5';
          badgeText = '#9a3412';
        } else if (score >= 40) {
          pinColor = '#eab308'; // Amber (Medium)
          pinGradient = 'linear-gradient(135deg, #eab308, #a16207)';
          badgeBg = '#fef9c3';
          badgeText = '#854d0e';
        }

        const customPin = L.divIcon({
          className: 'officer-severity-marker',
          html: `
            <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
              ${score >= 85 ? `<div style="position: absolute; width: 38px; height: 38px; border-radius: 50%; background: rgba(239, 68, 68, 0.4); z-index: 1;" class="${pulseClass}"></div>` : ''}
              <div style="position: relative; z-index: 2; width: 34px; height: 34px; border-radius: 50% 50% 50% 0; background: ${pinGradient}; transform: rotate(-45deg); border: 2px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center;">
                <span style="transform: rotate(45deg); font-weight: 800; font-size: 11px; color: #ffffff; font-family: monospace;">${Math.round(score)}</span>
              </div>
              <div style="position: absolute; bottom: -6px; width: 14px; height: 5px; background: rgba(0,0,0,0.3); border-radius: 50%; filter: blur(1.5px);"></div>
            </div>
          `,
          iconSize: [34, 40],
          iconAnchor: [17, 40],
          popupAnchor: [0, -38],
        });

        // Exact OpenStreetMap URL required by specification
        const osmUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`;

        const popupContent = document.createElement('div');
        popupContent.className = 'p-1 text-slate-900 font-sans max-w-[260px] space-y-2';
        popupContent.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
            <span style="font-weight: 800; font-size: 12px; color: #0f172a; font-family: monospace;">${c.tracking_code}</span>
            <span style="font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 9999px; background: ${badgeBg}; color: ${badgeText};">
              ${Math.round(score)}/100 ${c.urgency_level || 'URGENT'}
            </span>
          </div>
          <div style="font-size: 11px; color: #334155; line-height: 1.4; max-height: 48px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
            ${c.description}
          </div>
          <div style="font-size: 10px; color: #64748b; display: flex; align-items: center; gap: 4px;">
            <svg style="width: 12px; height: 12px; flex-shrink: 0; color: #2563eb;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
            <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c.address}</span>
          </div>
          <div style="display: flex; gap: 6px; padding-top: 4px;">
            <a 
              href="${osmUrl}" 
              target="_blank" 
              rel="noopener noreferrer"
              style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 4px; padding: 7px 10px; background: #0f172a; color: #ffffff; font-size: 11px; font-weight: 700; border-radius: 8px; text-decoration: none; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"
            >
              <span>Open Map Details</span>
              <svg style="width: 12px; height: 12px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
            </a>
            <button
              id="inspect-btn-${c.tracking_code}"
              style="padding: 7px 10px; background: #2563eb; color: #ffffff; font-size: 11px; font-weight: 700; border-radius: 8px; border: none; cursor: pointer;"
            >
              Inspect
            </button>
          </div>
        `;

        const marker = L.marker([lat, lng], { icon: customPin }).addTo(markersLayer);
        marker.bindPopup(popupContent, { maxWidth: 280 });

        marker.on('popupopen', () => {
          const inspectBtn = document.getElementById(`inspect-btn-${c.tracking_code}`);
          if (inspectBtn && onSelectComplaint) {
            inspectBtn.onclick = () => {
              onSelectComplaint(c);
            };
          }
        });
      });

      if (activeComplaints.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      }
    };

    initOrUpdateMap();

    return () => {
      isMounted = false;
    };
  }, [complaints, isFullscreen, onSelectComplaint]);

  // Invalidate size on fullscreen toggle
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current.invalidateSize();
      }, 200);
    }
  }, [isFullscreen]);

  return (
    <div
      className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md overflow-hidden transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none h-screen w-screen flex flex-col p-4 bg-slate-950/90 backdrop-blur-md'
          : 'relative'
      }`}
    >
      {/* Map Header Controls */}
      <div className="p-3 sm:p-4 bg-slate-900 text-white flex items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-600/30 text-blue-400 border border-blue-500/30">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Active Field Coordinates Map
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                {activePinCount} Active Pins
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-md">
              Plotting assigned PENDING & IN_PROGRESS coordinates in {officerJurisdiction}
            </p>
          </div>
        </div>

        {/* Fullscreen Button in Header */}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          title={isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen'}
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">Close</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">Expand</span>
            </>
          )}
        </button>
      </div>

      {/* Embedded Map Canvas */}
      <div
        ref={mapContainerRef}
        className={`w-full bg-slate-100 dark:bg-slate-950 z-0 ${
          isFullscreen ? 'flex-1 h-full min-h-[500px]' : 'h-[260px] sm:h-[320px]'
        }`}
      />

      {/* Legend & Action Bar below map */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Severity Legend */}
        <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600 dark:text-slate-300">
          <span className="text-slate-400 dark:text-slate-500 font-semibold uppercase text-[10px]">Pins:</span>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
            <span>Critical (&ge;85)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            <span>High (65-84)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
            <span>Medium (40-64)</span>
          </div>
        </div>

        {/* View Full Map Button (Mandatory specification) */}
        {!isFullscreen && (
          <button
            onClick={() => setIsFullscreen(true)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 hover:from-slate-800 hover:to-indigo-900 text-white font-bold text-xs shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
          >
            <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
            <span>View Full Map</span>
          </button>
        )}
      </div>
    </div>
  );
};
