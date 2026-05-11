import { useState, useMemo, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar/Sidebar';
import { MapView } from './components/MapView/MapView';
import { PointCard } from './components/PointCard/PointCard';
import { useInPostPoints } from './hooks/useInPostPoints';
import { isOpenAt } from './utils/hoursParser';
import { computeStats } from './utils/statistics';
import { reverseGeocode } from './api/nominatim';
import { fetchRoute } from './api/routing';
import type { Point } from './types/inpost';
import { AlertCircle, MapPin } from 'lucide-react';
import { clsx } from 'clsx';

/** Minimum zoom level before auto-loading points for the visible area */
const AUTO_LOAD_ZOOM_THRESHOLD = 11;

/** Debounce delay (ms) for map moveend auto-load — respects Nominatim 1 req/s limit */
const MOVE_DEBOUNCE_MS = 1200;

export default function App() {
  // Data
  const { points, isLoading, error, totalCount, searchedCity, search, findNearest, clear } =
    useInPostPoints();

  // UI state
  const [selectedHour, setSelectedHour] = useState<number>(new Date().getHours());
  const [showClosed, setShowClosed] = useState(false);
  const [easyAccessOnly, setEasyAccessOnly] = useState(false);
  const [showDisabled, setShowDisabled] = useState(false);
  const [onlyParcelLockers, setOnlyParcelLockers] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null);

  // Auto-load state
  const [autoLoadCity, setAutoLoadCity] = useState<string | null>(null);
  const [autoFit, setAutoFit] = useState(true);
  const moveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastGeocodedRef = useRef<string | null>(null); // avoid duplicate requests

  // Routing and Geolocation state
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [routeDuration, setRouteDuration] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Filtered points for map
  const filteredPoints = useMemo(() => {
    return points.filter((p) => {
      if (!showDisabled && p.status !== 'Operating') return false;
      if (easyAccessOnly && !p.easy_access_zone) return false;
      if (onlyParcelLockers && !p.type.includes('parcel_locker')) return false;
      if (!showClosed && !isOpenAt(p, selectedHour)) return false;
      return true;
    });
  }, [points, showDisabled, easyAccessOnly, onlyParcelLockers, showClosed, selectedHour]);

  // Stats from all loaded points
  const stats = useMemo(
    () => computeStats(points, (p) => isOpenAt(p, selectedHour)),
    [points, selectedHour],
  );

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleSelectPoint = useCallback(
    async (point: Point) => {
      setSelectedPoint(point);

      // If user location is known, calculate route
      if (userLocation) {
        const result = await fetchRoute(
          userLocation.lat,
          userLocation.lon,
          point.location.latitude,
          point.location.longitude,
        );
        setRouteCoords(result.coords);
        setRouteDistance(result.distance);
        setRouteDuration(result.duration);
      }
    },
    [userLocation],
  );

  const handleSearch = useCallback(
    (city: string) => {
      setAutoFit(true); // manual search → fit bounds to results
      search(city);
    },
    [search],
  );

  const handleClear = useCallback(() => {
    clear();
    setSelectedPoint(null);
    setAutoLoadCity(null);
    setRouteCoords([]);
    setRouteDistance(null);
    setRouteDuration(null);
    setUserLocation(null);
    lastGeocodedRef.current = null;
  }, [clear]);

  const handleFindNearest = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Your browser does not support geolocation.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lon: longitude });
        setAutoFit(true);
        await findNearest(latitude, longitude);
        setIsLocating(false);
      },
      (err) => {
        alert('Error retrieving location: ' + err.message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true },
    );
  }, [findNearest]);

  /**
   * Called by MapView on every `moveend` event.
   * If zoom ≥ threshold: debounce → Nominatim → search city (if different from current).
   */
  const handleMapMoveEnd = useCallback(
    (lat: number, lng: number, zoom: number) => {
      if (zoom < AUTO_LOAD_ZOOM_THRESHOLD) return;

      if (moveDebounceRef.current) {
        clearTimeout(moveDebounceRef.current);
      }

      moveDebounceRef.current = setTimeout(async () => {
        try {
          const city = await reverseGeocode(lat, lng);
          if (!city) return;

          // Avoid duplicate requests for the same geocoded city
          if (city === lastGeocodedRef.current) return;
          lastGeocodedRef.current = city;

          // Don't re-fetch if we already have this city loaded
          if (city === searchedCity) return;

          setAutoLoadCity(city);
          setAutoFit(false); // map-triggered search → don't auto-fit bounds
          search(city);
        } catch {
          // Silently ignore geocoding failures (network issues, rate limits)
        }
      }, MOVE_DEBOUNCE_MS);
    },
    [search, searchedCity],
  );

  // ────────────────────────────────────────────────────────────────────────────

  const totalCountDisplay = totalCount > 0 ? totalCount : points.length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans">
      {/* Sidebar */}
      <Sidebar
        isLoading={isLoading}
        searchedCity={searchedCity}
        autoLoadCity={autoLoadCity}
        onSearch={handleSearch}
        onClear={handleClear}
        onFindNearest={handleFindNearest}
        selectedHour={selectedHour}
        onHourChange={setSelectedHour}
        showClosed={showClosed}
        onShowClosedChange={setShowClosed}
        easyAccessOnly={easyAccessOnly}
        onEasyAccessChange={setEasyAccessOnly}
        showDisabled={showDisabled}
        onShowDisabledChange={setShowDisabled}
        onlyParcelLockers={onlyParcelLockers}
        onOnlyParcelLockersChange={setOnlyParcelLockers}
        stats={stats}
        filteredCount={filteredPoints.length}
      />

      {/* Main area */}
      <main className="flex-1 relative overflow-hidden">
        {/* Map */}
        {(points.length > 0 || isLoading || userLocation) && (
          <MapView
            points={filteredPoints}
            selectedHour={selectedHour}
            onSelectPoint={handleSelectPoint}
            selectedPoint={selectedPoint}
            onMoveEnd={handleMapMoveEnd}
            autoFit={autoFit}
            userLocation={userLocation}
            routeCoords={routeCoords}
            routeDistance={routeDistance}
            routeDuration={routeDuration}
          />
        )}

        {/* Empty state */}
        {points.length === 0 && !isLoading && !error && !userLocation && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-zinc-950">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-yellow-400/5 blur-3xl" />
            </div>

            <div className="relative flex flex-col items-center text-center max-w-sm px-6">
              <div className="w-20 h-20 rounded-3xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center mb-6">
                <MapPin size={36} className="text-yellow-400" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-100 mb-2">
                Start by searching for a city
              </h2>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Enter a city name in the left panel or click a suggestion to see
                InPost lockers in your area.
              </p>
              <p className="text-zinc-600 text-xs mt-3">
                💡 You can also zoom the map into a specific area — lockers will load automatically.
              </p>
            </div>

            <div className="relative flex flex-wrap gap-2 justify-center max-w-md px-6">
              {[
                { label: 'Warsaw', search: 'Warszawa' },
                { label: 'Krakow', search: 'Kraków' },
                { label: 'Wroclaw', search: 'Wrocław' },
                { label: 'Gdansk', search: 'Gdańsk' },
                { label: 'Poznan', search: 'Poznań' },
              ].map((city) => (
                <button
                  key={city.search}
                  onClick={() => handleSearch(city.search)}
                  className={clsx(
                    'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                    'bg-zinc-800/80 text-zinc-300 border border-zinc-700/60',
                    'hover:bg-yellow-400/10 hover:border-yellow-400/40 hover:text-yellow-300',
                    'active:scale-95',
                  )}
                >
                  {city.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Full-screen loading (first search or locating) */}
        {(isLoading || isLocating) && points.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 gap-4 z-[2000]">
            <div className="w-16 h-16 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-[3px] border-yellow-400 border-t-transparent animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-zinc-300 font-semibold">
                {isLocating ? 'Retrieving GPS location…' : 'Fetching data…'}
              </p>
              <p className="text-zinc-500 text-sm mt-1">
                {isLocating
                  ? 'Please allow access in your browser'
                  : autoLoadCity
                  ? `Detected: ${autoLoadCity}`
                  : 'Connecting to InPost Global Points API'}
              </p>
            </div>
          </div>
        )}

        {/* Overlay spinner when map already visible */}
        {isLoading && points.length > 0 && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-zinc-900/90 backdrop-blur-sm border border-zinc-700/60 rounded-xl px-3 py-2 shadow-lg z-[1000]">
            <div className="w-4 h-4 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin" />
            <span className="text-xs text-zinc-300">
              {autoLoadCity && autoLoadCity !== searchedCity
                ? `Loading ${autoLoadCity}…`
                : 'Updating…'}
            </span>
          </div>
        )}

        {/* Error toast */}
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 bg-red-900/90 backdrop-blur-sm border border-red-700/60 rounded-xl px-4 py-3 shadow-xl max-w-sm">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Point detail panel */}
        {selectedPoint && (
          <div
            id="point-detail-panel"
            className={clsx(
              'absolute top-0 right-0 h-full w-80 z-[500]',
              'bg-zinc-900/95 backdrop-blur-sm border-l border-zinc-800/60',
              'shadow-2xl overflow-y-auto animate-slide-in',
            )}
          >
            <PointCard
              point={selectedPoint}
              isOpenNow={isOpenAt(selectedPoint, selectedHour)}
              onClose={() => setSelectedPoint(null)}
              routeDistance={routeDistance}
              routeDuration={routeDuration}
            />
          </div>
        )}

        {/* Results count chip */}
        {filteredPoints.length > 0 && !isLoading && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400]">
            <div className="bg-zinc-900/90 backdrop-blur-sm border border-zinc-700/60 rounded-full px-4 py-2 shadow-lg flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-xs text-zinc-300 font-medium">
                {filteredPoints.length} points
                {searchedCity ? ` · ${searchedCity}` : ''}
                {totalCountDisplay > filteredPoints.length
                  ? ` (${totalCountDisplay} total)`
                  : ''}
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
