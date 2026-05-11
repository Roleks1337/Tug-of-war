import { ChevronDown, ChevronUp, Map, SlidersHorizontal, BarChart3, Search } from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';
import { CitySearch } from './CitySearch';
import { TimeSlider } from './TimeSlider';
import { FilterPanel } from './FilterPanel';
import { StatsPanel } from './StatsPanel';
import { Toggle } from '../UI/Toggle';
import type { DashboardStats } from '../../utils/statistics';

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  id: string;
}

function Section({ title, icon, children, defaultOpen = true, id }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-zinc-800/60 rounded-2xl overflow-hidden">
      <button
        id={`section-${id}-toggle`}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900/80 hover:bg-zinc-800/60 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-yellow-400">{icon}</span>
          <span className="text-sm font-semibold text-zinc-200">{title}</span>
        </div>
        <span className="text-zinc-600">
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </span>
      </button>

      <div
        className={clsx(
          'transition-all duration-300 origin-top overflow-hidden',
          open ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <div className="p-4 bg-zinc-900/40">{children}</div>
      </div>
    </div>
  );
}

interface SidebarProps {
  // Search
  isLoading: boolean;
  searchedCity: string | null;
  autoLoadCity: string | null;
  onSearch: (city: string) => void;
  onClear: () => void;
  onFindNearest: () => void;
  // Time
  selectedHour: number;
  onHourChange: (h: number) => void;
  showClosed: boolean;
  onShowClosedChange: (v: boolean) => void;
  // Filters
  easyAccessOnly: boolean;
  onEasyAccessChange: (v: boolean) => void;
  showDisabled: boolean;
  onShowDisabledChange: (v: boolean) => void;
  onlyParcelLockers: boolean;
  onOnlyParcelLockersChange: (v: boolean) => void;
  // Stats
  stats: DashboardStats;
  filteredCount: number;
}

export function Sidebar({
  isLoading,
  searchedCity,
  autoLoadCity,
  onSearch,
  onClear,
  onFindNearest,
  selectedHour,
  onHourChange,
  showClosed,
  onShowClosedChange,
  easyAccessOnly,
  onEasyAccessChange,
  showDisabled,
  onShowDisabledChange,
  onlyParcelLockers,
  onOnlyParcelLockersChange,
  stats,
  filteredCount,
}: SidebarProps) {
  return (
    <aside
      id="sidebar"
      className="w-80 flex-shrink-0 h-full flex flex-col bg-zinc-950/95 border-r border-zinc-800/60 overflow-y-auto"
    >
      {/* Logo header */}
      <div className="px-5 py-4 border-b border-zinc-800/60 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-yellow-400 flex items-center justify-center flex-shrink-0">
            <span className="text-zinc-900 font-black text-sm leading-none">IP</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-zinc-100 leading-tight">
              InPost Time-Traveler
            </h1>
            <p className="text-[11px] text-zinc-500 leading-tight">& Accessibility Suite</p>
          </div>
        </div>

        {/* Filtered count badge */}
        {stats.total > 0 && (
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-zinc-500">Displayed</span>
            <span className="font-semibold text-zinc-300">
              {filteredCount} / {stats.total}
            </span>
          </div>
        )}
      </div>

      {/* Scrollable sections */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
        <Section id="search" title="Search city" icon={<Search size={14} />}>
          <CitySearch
            onSearch={onSearch}
            onClear={onClear}
            isLoading={isLoading}
            searchedCity={searchedCity}
            autoLoadCity={autoLoadCity}
            onFindNearest={onFindNearest}
          />
        </Section>

        {stats.total > 0 && (
          <>
            <Section id="stats" title="Statistics" icon={<BarChart3 size={14} />}>
              <StatsPanel stats={stats} selectedHour={selectedHour} />
            </Section>

            <Section id="time" title="Time-Traveler" icon={<Map size={14} />}>
              <div className="space-y-4">
                <TimeSlider hour={selectedHour} onChange={onHourChange} />
                <div className="h-px bg-zinc-800/60 -mx-4" />
                <Toggle
                  id="show-closed-toggle"
                  checked={showClosed}
                  onChange={onShowClosedChange}
                  label="Show closed lockers"
                  description="When enabled, lockers closed at this time will not disappear, but will turn yellow"
                />
              </div>
            </Section>

            <Section id="filters" title="Filters" icon={<SlidersHorizontal size={14} />}>
              <FilterPanel
                easyAccessOnly={easyAccessOnly}
                onEasyAccessChange={onEasyAccessChange}
                showDisabled={showDisabled}
                onShowDisabledChange={onShowDisabledChange}
                onlyParcelLockers={onlyParcelLockers}
                onOnlyParcelLockersChange={onOnlyParcelLockersChange}
              />
            </Section>

            {/* Legend */}
            <div className="p-3 rounded-2xl border border-zinc-800/60 bg-zinc-900/40">
              <p className="text-xs font-semibold text-zinc-400 mb-2.5">Map legend</p>
              <div className="space-y-1.5">
                {[
                  { color: '#22c55e', label: 'Open now' },
                  { color: '#3b82f6', label: 'Open + Easy Access' },
                  { color: '#facc15', label: 'Closed at selected time' },
                  { color: '#ef4444', label: 'Disabled' },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0 border-2 border-white/30"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[11px] text-zinc-400">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-zinc-800/60 flex-shrink-0">
        <p className="text-[10px] text-zinc-600 text-center">
          Data: InPost Global Points API · Live update
        </p>
      </div>
    </aside>
  );
}
