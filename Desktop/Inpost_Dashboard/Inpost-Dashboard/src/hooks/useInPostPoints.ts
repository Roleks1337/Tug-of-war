import { useState, useCallback, useRef } from 'react';
import type { Point } from '../types/inpost';
import { fetchAllPointsForCity, fetchPoints } from '../api/inpostApi';

export interface UseInPostPointsResult {
  points: Point[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  searchedCity: string | null;
  search: (city: string) => Promise<void>;
  findNearest: (lat: number, lon: number) => Promise<void>;
  clear: () => void;
}

/**
 * Custom hook that manages InPost point data.
 *
 * - Fetches all pages for a given city in parallel (up to 10 pages)
 * - Tracks loading/error state
 * - Exposes `search(city)` and `clear()` actions
 */
export function useInPostPoints(): UseInPostPointsResult {
  const [points, setPoints] = useState<Point[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [searchedCity, setSearchedCity] = useState<string | null>(null);

  // Track the latest search request to ignore stale responses
  const searchIdRef = useRef(0);

  const search = useCallback(async (city: string) => {
    const currentId = ++searchIdRef.current;

    setIsLoading(true);
    setError(null);
    setPoints([]);
    setTotalCount(0);

    try {
      const data = await fetchAllPointsForCity(city, 'PL', 10);

      // Ignore if a newer search was started
      if (searchIdRef.current !== currentId) return;

      setPoints(data.items);
      setTotalCount(data.count);
      setSearchedCity(city);
    } catch (err) {
      if (searchIdRef.current !== currentId) return;

      const message =
        err instanceof Error ? err.message : 'Unknown error during data fetch.';
      setError(message);
    } finally {
      if (searchIdRef.current === currentId) {
        setIsLoading(false);
      }
    }
  }, []);

  const findNearest = useCallback(async (lat: number, lon: number) => {
    const currentId = ++searchIdRef.current;

    setIsLoading(true);
    setError(null);
    setPoints([]);
    setTotalCount(0);

    try {
      // Fetch 25 nearest points
      const data = await fetchPoints({ relativePoint: `${lat},${lon}`, perPage: 25 });

      if (searchIdRef.current !== currentId) return;

      setPoints(data.items);
      setTotalCount(data.count);
      setSearchedCity('Nearby');
    } catch (err) {
      if (searchIdRef.current !== currentId) return;

      const message =
        err instanceof Error ? err.message : 'Unknown error during data fetch.';
      setError(message);
    } finally {
      if (searchIdRef.current === currentId) {
        setIsLoading(false);
      }
    }
  }, []);

  const clear = useCallback(() => {
    searchIdRef.current++;
    setPoints([]);
    setIsLoading(false);
    setError(null);
    setTotalCount(0);
    setSearchedCity(null);
  }, []);

  return { points, isLoading, error, totalCount, searchedCity, search, findNearest, clear };
}
