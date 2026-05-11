import { Package, CheckCircle, Accessibility, Zap } from 'lucide-react';
import { clsx } from 'clsx';
import type { DashboardStats } from '../../utils/statistics';

interface StatsPanelProps {
  stats: DashboardStats;
  selectedHour: number;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: 'yellow' | 'green' | 'blue' | 'purple';
}

function StatCard({ icon, label, value, sub, accent = 'yellow' }: StatCardProps) {
  const accentClasses = {
    yellow: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    green: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    blue: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    purple: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  };

  return (
    <div
      className={clsx(
        'p-3 rounded-xl border transition-all duration-300',
        accentClasses[accent],
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5">{icon}</div>
        <div className="min-w-0">
          <p className="text-xs text-zinc-400 font-medium leading-tight">{label}</p>
          <p className="text-xl font-bold text-zinc-100 leading-none mt-1">{value}</p>
          {sub && <p className="text-[11px] text-zinc-500 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

export function StatsPanel({ stats, selectedHour }: StatsPanelProps) {
  const hourLabel = `${String(selectedHour).padStart(2, '0')}:00`;
  const openPercent =
    stats.total > 0 ? Math.round((stats.openAtTime / stats.total) * 100) : 0;
  const easyPercent =
    stats.total > 0 ? Math.round((stats.easyAccess / stats.total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 gap-2">
      <StatCard
        icon={<Package size={15} className="text-yellow-400" />}
        label="Loaded"
        value={stats.total}
        sub={`${stats.operating} operating`}
        accent="yellow"
      />
      <StatCard
        icon={<CheckCircle size={15} className="text-emerald-400" />}
        label={`Open at ${hourLabel}`}
        value={stats.openAtTime}
        sub={`${openPercent}% of loaded`}
        accent="green"
      />
      <StatCard
        icon={<Accessibility size={15} className="text-blue-400" />}
        label="Easy Access"
        value={stats.easyAccess}
        sub={`${easyPercent}% of total`}
        accent="blue"
      />
      <StatCard
        icon={<Zap size={15} className="text-purple-400" />}
        label="InPost Next"
        value={stats.nextGeneration}
        sub="Next generation"
        accent="purple"
      />
    </div>
  );
}
