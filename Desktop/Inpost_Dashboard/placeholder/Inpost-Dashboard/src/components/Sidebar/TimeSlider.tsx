import { Clock } from 'lucide-react';
import { clsx } from 'clsx';

interface TimeSliderProps {
  hour: number;
  onChange: (hour: number) => void;
}

export function TimeSlider({ hour, onChange }: TimeSliderProps) {
  const label = `${String(hour).padStart(2, '0')}:00`;

  // Color the track fill based on hour
  const fillPercent = (hour / 23) * 100;

  // Decide if it's nighttime for accent color
  const isNight = hour < 7 || hour >= 22;
  const isDusk = (hour >= 19 && hour < 22) || (hour >= 7 && hour < 9);

  const accentColor = isNight
    ? 'text-indigo-400'
    : isDusk
    ? 'text-orange-400'
    : 'text-yellow-400';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={14} className={clsx('transition-colors duration-300', accentColor)} />
          <span className="text-xs font-medium text-zinc-400">Time-Traveler</span>
        </div>
        <div
          className={clsx(
            'px-3 py-1 rounded-lg text-sm font-mono font-bold transition-colors duration-300',
            isNight
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              : isDusk
              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
              : 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/30',
          )}
        >
          {label}
        </div>
      </div>

      {/* Slider */}
      <div className="relative">
        <input
          id="time-slider"
          type="range"
          min={0}
          max={23}
          step={1}
          value={hour}
          onChange={(e) => onChange(Number(e.target.value))}
          className="time-slider w-full h-2 rounded-full appearance-none cursor-pointer"
          style={
            {
              background: `linear-gradient(to right, ${isNight ? '#818cf8' : isDusk ? '#fb923c' : '#facc15'} 0%, ${isNight ? '#818cf8' : isDusk ? '#fb923c' : '#facc15'} ${fillPercent}%, #3f3f46 ${fillPercent}%, #3f3f46 100%)`,
            } as React.CSSProperties
          }
          aria-label={`Selected hour: ${label}`}
        />
        {/* Hour tick marks */}
        <div className="flex justify-between mt-1.5 px-0.5">
          {[0, 6, 12, 18, 23].map((h) => (
            <span key={h} className="text-[10px] text-zinc-600 font-mono">
              {String(h).padStart(2, '0')}
            </span>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-zinc-500 leading-snug">
        Points unavailable at this time will be{' '}
        <span className="text-zinc-400 font-medium">hidden</span> on the map.
      </p>
    </div>
  );
}
