import { X, MapPin, Clock, Package, Accessibility, CheckCircle, XCircle, Wifi } from 'lucide-react';
import { clsx } from 'clsx';
import type { Point } from '../../types/inpost';
import { Badge } from '../UI/Badge';
import { formatOpeningHours } from '../../utils/hoursParser';

interface PointCardProps {
  point: Point;
  isOpenNow: boolean;
  onClose: () => void;
  routeDistance?: number | null;
  routeDuration?: number | null;
}

function LockerSlot({ label, status }: { label: string; status: string }) {
  const isAvailable = status === 'AVAILABLE';
  const isUnavailable = status === 'UNAVAILABLE';

  return (
    <div
      className={clsx(
        'flex flex-col items-center gap-1 flex-1 p-2 rounded-lg border text-xs font-semibold',
        isAvailable
          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
          : isUnavailable
          ? 'bg-red-500/15 border-red-500/30 text-red-400'
          : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-500',
      )}
    >
      <span className="text-base">{label}</span>
      <span className="text-[10px] tracking-wide">
        {isAvailable ? 'available' : isUnavailable ? 'full' : 'no data'}
      </span>
    </div>
  );
}

export function PointCard({ point, isOpenNow, onClose, routeDistance }: PointCardProps) {
  const statusVariant = point.status === 'Operating' ? 'green' : 'red';
  const displayDistance = routeDistance !== undefined && routeDistance !== null ? routeDistance : point.distance;

  // Strictly use 100m = 1m 10s (70s) logic as requested by user
  const walkingTimeMin = displayDistance 
    ? Math.max(1, Math.round((displayDistance / 100) * (70 / 60))) 
    : null;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 p-4 border-b border-zinc-800">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-zinc-100 font-mono">{point.name}</h3>
            {point.is_next && (
              <Badge variant="purple">Next</Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <MapPin size={12} className="text-zinc-500 flex-shrink-0" />
            <p className="text-xs text-zinc-400 truncate">
              {point.address.line1}, {point.address.line2}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50 transition-colors flex-shrink-0"
          aria-label="Close panel"
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Status row */}
        <div className="flex flex-wrap gap-2">
          <Badge variant={statusVariant}>
            {point.status === 'Operating' ? <CheckCircle size={10} /> : <XCircle size={10} />}
            {point.status}
          </Badge>
          <Badge variant={isOpenNow ? 'green' : 'gray'}>
            <Clock size={10} />
            {isOpenNow ? 'Open now' : 'Closed now'}
          </Badge>
          {displayDistance !== null && displayDistance !== undefined && (
            <Badge variant="blue" className="bg-blue-500/20 border-blue-500/40 py-1.5 px-3">
              <MapPin size={11} className="mr-1" />
              <div className="flex flex-col items-start leading-tight">
                <span className="font-bold">
                  {displayDistance < 1000 ? `${Math.round(displayDistance)} m` : `${(displayDistance / 1000).toFixed(2)} km`}
                </span>
                {walkingTimeMin && (
                  <span className="text-[10px] opacity-90 font-medium">
                    ~{walkingTimeMin} min walk
                  </span>
                )}
              </div>
            </Badge>
          )}
          {point.easy_access_zone && (
            <Badge variant="blue">
              <Accessibility size={10} />
              Easy Access
            </Badge>
          )}
          {point.location_247 && (
            <Badge variant="yellow">
              <Wifi size={10} />
              24/7
            </Badge>
          )}
        </div>

        {/* Photo */}
        {point.image_url && (
          <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
            <img
              src={point.image_url}
              alt={`Photo of point ${point.name}`}
              className="w-full h-36 object-cover"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Opening hours */}
        <div className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700/50">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={13} className="text-zinc-500" />
            <span className="text-xs font-medium text-zinc-400">Opening hours</span>
          </div>
          <p className="text-sm font-semibold text-zinc-200">
            {formatOpeningHours(point.opening_hours)}
          </p>
          {point.location_description && (
            <p className="text-xs text-zinc-500 mt-1">{point.location_description}</p>
          )}
        </div>

        {/* Locker availability */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Package size={13} className="text-zinc-500" />
            <span className="text-xs font-medium text-zinc-400">Lockers</span>
          </div>
          <div className="flex gap-2">
            {(['A', 'B', 'C'] as const).map((size) => (
              <LockerSlot
                key={size}
                label={size}
                status={point.locker_availability.details[size]}
              />
            ))}
          </div>
          <p className="text-[10px] text-zinc-600 mt-1.5">
            A = small · B = medium · C = large
          </p>
        </div>

        {/* Location type */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">Location</span>
          <span className="text-zinc-300 font-medium">{point.location_type}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">Physical type</span>
          <span className="text-zinc-300 font-medium">{point.physical_type}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">Agency</span>
          <span className="text-zinc-300 font-medium">{point.agency}</span>
        </div>

        {/* Functions (collapsed list) */}
        <details className="group">
          <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-400 transition-colors select-none flex items-center gap-1">
            <span className="group-open:rotate-90 transition-transform duration-150">▶</span>
            Functions ({point.functions.length})
          </summary>
          <div className="mt-2 flex flex-wrap gap-1">
            {point.functions.map((fn) => (
              <span
                key={fn}
                className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-500 border border-zinc-700/50"
              >
                {fn}
              </span>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}
