import { clsx } from 'clsx';

interface ToggleProps {
  id: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

export function Toggle({ id, checked, onChange, label, description, icon }: ToggleProps) {
  return (
    <label
      htmlFor={id}
      className={clsx(
        'flex items-center gap-3 p-3 rounded-xl cursor-pointer select-none transition-all duration-200',
        'border',
        checked
          ? 'bg-yellow-400/10 border-yellow-400/40'
          : 'bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600/50',
      )}
    >
      {icon && (
        <span className={clsx('text-lg', checked ? 'text-yellow-400' : 'text-zinc-500')}>
          {icon}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <p className={clsx('text-sm font-medium', checked ? 'text-yellow-300' : 'text-zinc-300')}>
          {label}
        </p>
        {description && (
          <p className="text-xs text-zinc-500 mt-0.5 leading-snug">{description}</p>
        )}
      </div>
      {/* Toggle switch */}
      <div className="relative flex-shrink-0">
        <input
          id={id}
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div
          className={clsx(
            'w-10 h-5 rounded-full transition-all duration-200',
            checked ? 'bg-yellow-400' : 'bg-zinc-700',
          )}
        />
        <div
          className={clsx(
            'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200',
            checked ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </div>
    </label>
  );
}
