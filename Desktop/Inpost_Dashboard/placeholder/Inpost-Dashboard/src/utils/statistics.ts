import type { Point } from '../types/inpost';

export interface DashboardStats {
  total: number;
  operating: number;
  openAtTime: number;
  easyAccess: number;
  parcelLockers: number;
  nextGeneration: number;
  outdoor: number;
  indoor: number;
  byProvince: Record<string, number>;
}

/**
 * Computes summary statistics from a list of points.
 * @param points - list of InPost points
 * @param openAtTimeFn - predicate to check if a point is open at the selected time
 */
export function computeStats(
  points: Point[],
  openAtTimeFn: (p: Point) => boolean,
): DashboardStats {
  const stats: DashboardStats = {
    total: points.length,
    operating: 0,
    openAtTime: 0,
    easyAccess: 0,
    parcelLockers: 0,
    nextGeneration: 0,
    outdoor: 0,
    indoor: 0,
    byProvince: {},
  };

  for (const point of points) {
    if (point.status === 'Operating') stats.operating++;
    if (openAtTimeFn(point)) stats.openAtTime++;
    if (point.easy_access_zone) stats.easyAccess++;
    if (point.type.includes('parcel_locker')) stats.parcelLockers++;
    if (point.is_next) stats.nextGeneration++;

    const locType = point.location_type?.toLowerCase() ?? '';
    if (locType === 'outdoor') stats.outdoor++;
    else if (locType.startsWith('indoor')) stats.indoor++;

    const province = point.address_details?.province ?? 'unknown';
    stats.byProvince[province] = (stats.byProvince[province] ?? 0) + 1;
  }

  return stats;
}

/**
 * Returns top N provinces by point count, sorted descending.
 */
export function topProvinces(
  byProvince: Record<string, number>,
  n = 5,
): Array<{ province: string; count: number }> {
  return Object.entries(byProvince)
    .map(([province, count]) => ({ province, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}
