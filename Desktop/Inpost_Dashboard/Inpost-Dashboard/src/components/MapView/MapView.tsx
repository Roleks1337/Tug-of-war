import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, useMap, useMapEvents, Polyline, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { Point } from '../../types/inpost';
import { isOpenAt } from '../../utils/hoursParser';

// Fix default icon paths broken by bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/** Creates a small colored SVG circle marker */
function createMarkerIcon(color: string, opacity: number): L.DivIcon {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">
      <circle cx="11" cy="11" r="8" fill="${color}" fill-opacity="${opacity}" stroke="white" stroke-width="2" stroke-opacity="${Math.min(opacity + 0.2, 1)}"/>
      <circle cx="11" cy="11" r="3" fill="white" fill-opacity="${opacity}"/>
    </svg>`;

  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  });
}

/** Creates a distinct purple pin for the user's location */
function createUserLocationIcon(): L.DivIcon {
  const html = `
    <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
      <div class="marker-pulse-ring" style="border-color:#a855f7;animation-duration: 2s;"></div>
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#a855f7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position:relative;z-index:2;filter: drop-shadow(0 0 4px rgba(168,85,247,0.8));">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
        <circle cx="12" cy="10" r="3" fill="white" stroke="none"></circle>
      </svg>
    </div>`;

  return L.divIcon({
    html,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 36],
    popupAnchor: [0, -36],
  });
}

/** Creates the selected-state marker — larger with a pulsing ring */
function createSelectedMarkerIcon(color: string): L.DivIcon {
  const html = `
    <div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
      <div class="marker-pulse-ring" style="border-color:${color};"></div>
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" style="position:relative;z-index:2;">
        <circle cx="14" cy="14" r="11" fill="${color}" stroke="white" stroke-width="3"/>
        <circle cx="14" cy="14" r="5" fill="white"/>
      </svg>
    </div>`;

  return L.divIcon({
    html,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

const ICONS = {
  openEasyAccess: createMarkerIcon('#3b82f6', 1),
  open: createMarkerIcon('#22c55e', 1),
  closedAtTime: createMarkerIcon('#facc15', 0.4),
  disabled: createMarkerIcon('#ef4444', 0.5),
};

const SELECTED_ICONS = {
  openEasyAccess: createSelectedMarkerIcon('#3b82f6'),
  open: createSelectedMarkerIcon('#22c55e'),
  closedAtTime: createSelectedMarkerIcon('#facc15'),
  disabled: createSelectedMarkerIcon('#ef4444'),
};

/** Auto-fit to bounds when a new set of points loads or user location is available */
function FitBounds({ points, enabled, userLocation }: { points: Point[]; enabled: boolean, userLocation?: { lat: number; lon: number } | null }) {
  const map = useMap();
  const prevLength = useRef(0);
  const prevUserLoc = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    
    const userLocStr = userLocation ? `${userLocation.lat},${userLocation.lon}` : null;
    if (points.length === 0 && !userLocation) return;
    if (points.length === prevLength.current && userLocStr === prevUserLoc.current) return;
    
    prevLength.current = points.length;
    prevUserLoc.current = userLocStr;

    const coords: [number, number][] = points.map((p) => [p.location.latitude, p.location.longitude]);
    if (userLocation) {
      coords.push([userLocation.lat, userLocation.lon]);
    }

    const bounds = L.latLngBounds(coords);
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [map, points, enabled, userLocation]);

  return null;
}

/** Fires when the map stops moving; used for auto-load by zoom */
function MapEventHandler({
  onMoveEnd,
}: {
  onMoveEnd: (lat: number, lng: number, zoom: number) => void;
}) {
  useMapEvents({
    moveend(e) {
      const center = (e.target as L.Map).getCenter();
      const zoom = (e.target as L.Map).getZoom();
      onMoveEnd(center.lat, center.lng, zoom);
    },
  });
  return null;
}

interface MapViewProps {
  points: Point[];
  selectedHour: number;
  onSelectPoint: (point: Point) => void;
  selectedPoint: Point | null;
  onMoveEnd: (lat: number, lng: number, zoom: number) => void;
  autoFit?: boolean;
  userLocation?: { lat: number; lon: number } | null;
  routeCoords?: [number, number][];
  routeDistance?: number | null;
  routeDuration?: number | null;
}

export function MapView({
  points,
  selectedHour,
  onSelectPoint,
  selectedPoint,
  onMoveEnd,
  autoFit = true,
  userLocation,
  routeCoords = [],
  routeDistance = null,
}: MapViewProps) {
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const polandCenter: [number, number] = [52.069, 19.48];

  // If we only have userLocation, center map on it
  const center = points.length === 0 && userLocation 
    ? [userLocation.lat, userLocation.lon] as [number, number] 
    : polandCenter;

  return (
    <MapContainer
      center={center}
      zoom={userLocation ? 14 : 6}
      className="w-full h-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        maxZoom={19}
        subdomains="abcd"
      />

      <FitBounds points={points} enabled={autoFit} userLocation={userLocation} />
      <MapEventHandler onMoveEnd={onMoveEnd} />

      {routeCoords.length > 0 && (
        <>
          <Polyline 
            positions={routeCoords} 
            pathOptions={{ color: '#3b82f6', weight: 4, dashArray: '8, 8', opacity: 0.8 }} 
          />
          {routeDistance !== null && routeDistance !== undefined && (
            <Marker 
              position={routeCoords[Math.floor(routeCoords.length / 2)]}
              icon={L.divIcon({
                className: '',
                html: `<div style="transform: translate(-50%, -50%);" class="flex flex-col items-center bg-blue-600/95 text-white border border-blue-400 font-bold text-[11px] px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap inline-block leading-tight">
                  <span>${routeDistance < 1000 ? `${Math.round(routeDistance)} m` : `${(routeDistance / 1000).toFixed(2)} km`}</span>
                  <span class="text-[9px] opacity-90 mt-0.5">~${Math.max(1, Math.round((routeDistance / 100) * (70 / 60)))} min walk</span>
                </div>`,
                iconSize: [0, 0],
              })}
              zIndexOffset={500}
            />
          )}
        </>
      )}

      <MarkerLayer
        points={points}
        selectedHour={selectedHour}
        onSelectPoint={onSelectPoint}
        selectedPoint={selectedPoint}
        markersRef={markersRef}
        userLocation={userLocation}
      />
    </MapContainer>
  );
}

interface MarkerLayerProps {
  points: Point[];
  selectedHour: number;
  onSelectPoint: (point: Point) => void;
  selectedPoint: Point | null;
  markersRef: React.RefObject<Map<string, L.Marker>>;
  userLocation?: { lat: number; lon: number } | null;
}

function MarkerLayer({
  points,
  selectedHour,
  onSelectPoint,
  selectedPoint,
  markersRef,
  userLocation,
}: MarkerLayerProps) {
  const map = useMap();
  const layerRef = useRef<L.LayerGroup>(L.layerGroup());

  useEffect(() => {
    layerRef.current.addTo(map);
    return () => {
      layerRef.current.remove();
    };
  }, [map]);

  useEffect(() => {
    layerRef.current.clearLayers();
    markersRef.current.clear();

    for (const point of points) {
      const openNow = isOpenAt(point, selectedHour);
      const isDisabled = point.status !== 'Operating';
      const isSelected = selectedPoint?.name === point.name;

      // Determine base category
      type IconKey = 'disabled' | 'closedAtTime' | 'openEasyAccess' | 'open';
      let category: IconKey;
      if (isDisabled) {
        category = 'disabled';
      } else if (!openNow) {
        category = 'closedAtTime';
      } else if (point.easy_access_zone) {
        category = 'openEasyAccess';
      } else {
        category = 'open';
      }

      const icon = isSelected ? SELECTED_ICONS[category] : ICONS[category];
      const marker = L.marker([point.location.latitude, point.location.longitude], {
        icon,
        zIndexOffset: isSelected ? 1000 : 0,
      });

      marker.on('click', () => onSelectPoint(point));

      marker.bindTooltip(
        `<div style="font-family:JetBrains Mono,monospace;font-weight:700;font-size:12px">${point.name}</div>
         <div style="font-size:11px;color:#a1a1aa;margin-top:2px">${point.address.line1}</div>`,
        {
          className: 'leaflet-tooltip-dark',
          direction: 'top',
          offset: [0, isSelected ? -20 : -12],
        },
      );

      layerRef.current.addLayer(marker);
      markersRef.current.set(point.name, marker);
    }

    if (userLocation) {
      const userMarker = L.marker([userLocation.lat, userLocation.lon], {
        icon: createUserLocationIcon(),
        zIndexOffset: 2000,
      });
      userMarker.bindTooltip('<div class="text-xs font-bold">My location</div>', {
        className: 'leaflet-tooltip-dark',
        direction: 'top',
        offset: [0, -12],
      });
      layerRef.current.addLayer(userMarker);
    }

  }, [points, selectedHour, onSelectPoint, selectedPoint, markersRef, userLocation]);

  return null;
}
