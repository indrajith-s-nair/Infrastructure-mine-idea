'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Navigation, Loader2, AlertCircle, Search } from 'lucide-react';

interface MapPickerProps {
  initialLat?: number | null;
  initialLng?: number | null;
  initialAddress?: string;
  onLocationChange: (location: { lat: number; lng: number; address: string }) => void;
  addressValue: string;
  onAddressChange: (address: string) => void;
}

export const MapPicker: React.FC<MapPickerProps> = ({
  initialLat = 28.6139, // Default: New Delhi / National Capital
  initialLng = 77.2090,
  onLocationChange,
  addressValue,
  onAddressChange,
}) => {
  const [lat, setLat] = useState<number>(initialLat || 28.6139);
  const [lng, setLng] = useState<number>(initialLng || 77.2090);
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);

  // Reverse geocoding helper using Nominatim
  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.display_name) {
          onAddressChange(data.display_name);
          onLocationChange({ lat: latitude, lng: longitude, address: data.display_name });
          return;
        }
      }
    } catch {
      // Ignore network errors on reverse geocode and retain manual input
    }
    onLocationChange({ lat: latitude, lng: longitude, address: addressValue });
  };

  const updateMarkerPosition = useCallback((newLat: number, newLng: number, triggerReverse = false) => {
    setLat(newLat);
    setLng(newLng);

    if (markerInstanceRef.current) {
      markerInstanceRef.current.setLatLng([newLat, newLng]);
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([newLat, newLng], 16);
    }

    if (triggerReverse) {
      reverseGeocode(newLat, newLng);
    } else {
      onLocationChange({ lat: newLat, lng: newLng, address: addressValue });
    }
  }, [addressValue, onLocationChange]);

  // Initialize Leaflet dynamically on client side
  useEffect(() => {
    let isMounted = true;

    const initLeaflet = async () => {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      // Dynamic import leaflet CSS & JS
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      if (!isMounted || !mapContainerRef.current || mapInstanceRef.current) return;

      // Custom high-contrast Gov pin icon
      const customPinIcon = L.divIcon({
        className: 'custom-leaflet-pin',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="width: 36px; height: 36px; border-radius: 50% 50% 50% 0; background: linear-gradient(135deg, #ef4444, #b91c1c); transform: rotate(-45deg); border: 2px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
              <div style="width: 12px; height: 12px; background: #ffffff; border-radius: 50%; transform: rotate(45deg);"></div>
            </div>
            <div style="position: absolute; bottom: -8px; width: 14px; height: 6px; background: rgba(0,0,0,0.35); border-radius: 50%; filter: blur(2px);"></div>
          </div>
        `,
        iconSize: [36, 42],
        iconAnchor: [18, 42],
      });

      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 14,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([lat, lng], {
        icon: customPinIcon,
        draggable: true,
      }).addTo(map);

      marker.on('dragend', (e: any) => {
        const position = e.target.getLatLng();
        updateMarkerPosition(position.lat, position.lng, true);
      });

      map.on('click', (e: any) => {
        updateMarkerPosition(e.latlng.lat, e.latlng.lng, true);
      });

      mapInstanceRef.current = map;
      markerInstanceRef.current = marker;
      setIsMapReady(true);
    };

    initLeaflet();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle Geolocation Button click
  const handleUseCurrentLocation = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentLat = position.coords.latitude;
        const currentLng = position.coords.longitude;
        setIsLocating(false);
        updateMarkerPosition(currentLat, currentLng, true);
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGeoError('Location permission was denied. Please allow location access in your browser.');
        } else {
          setGeoError('Unable to retrieve your location. Please drop a pin manually or enter your address.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="space-y-4">
      {/* Address Text Input */}
      <div>
        <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
          Exact Address & Location Details <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            required
            placeholder="e.g. Ward 14, Main Market Road, Near Government Primary School"
            value={addressValue}
            onChange={(e) => {
              onAddressChange(e.target.value);
              onLocationChange({ lat, lng, address: e.target.value });
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        </div>
      </div>

      {/* Geolocation Button Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {isLocating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Navigation className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-300" />
          )}
          <span>{isLocating ? 'Detecting GPS Location...' : 'Use Exact Location (GPS Pin)'}</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
          <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            LAT: {lat.toFixed(5)}
          </span>
          <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            LNG: {lng.toFixed(5)}
          </span>
        </div>
      </div>

      {geoError && (
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{geoError}</span>
        </div>
      )}

      {/* Map Container */}
      <div className="relative w-full h-72 sm:h-80 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 shadow-inner bg-slate-100 dark:bg-slate-950">
        <div ref={mapContainerRef} className="w-full h-full" />
        
        {/* Map overlay hint */}
        <div className="absolute bottom-2 left-2 z-20 pointer-events-none px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-medium shadow-xs">
          Click map or drag the red pin to adjust exact location
        </div>
      </div>
    </div>
  );
};
