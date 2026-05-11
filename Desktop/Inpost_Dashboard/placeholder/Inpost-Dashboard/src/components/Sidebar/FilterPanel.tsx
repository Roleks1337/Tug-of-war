import { Accessibility, WifiOff, Package } from 'lucide-react';
import { Toggle } from '../UI/Toggle';

interface FilterPanelProps {
  easyAccessOnly: boolean;
  onEasyAccessChange: (v: boolean) => void;
  showDisabled: boolean;
  onShowDisabledChange: (v: boolean) => void;
  onlyParcelLockers: boolean;
  onOnlyParcelLockersChange: (v: boolean) => void;
}

export function FilterPanel({
  easyAccessOnly,
  onEasyAccessChange,
  showDisabled,
  onShowDisabledChange,
  onlyParcelLockers,
  onOnlyParcelLockersChange,
}: FilterPanelProps) {
  return (
    <div className="space-y-2">
      <Toggle
        id="easy-access-toggle"
        checked={easyAccessOnly}
        onChange={onEasyAccessChange}
        label="Easy Access Zone"
        description="Only points adapted for seniors and people with disabilities"
        icon={<Accessibility size={16} />}
      />
      <Toggle
        id="only-parcel-lockers-toggle"
        checked={onlyParcelLockers}
        onChange={onOnlyParcelLockersChange}
        label="Only parcel lockers"
        description="Filter down to parcel_locker type points"
        icon={<Package size={16} />}
      />
      <Toggle
        id="show-disabled-toggle"
        checked={showDisabled}
        onChange={onShowDisabledChange}
        label="Show disabled"
        description="Include points with Disabled status"
        icon={<WifiOff size={16} />}
      />
    </div>
  );
}
