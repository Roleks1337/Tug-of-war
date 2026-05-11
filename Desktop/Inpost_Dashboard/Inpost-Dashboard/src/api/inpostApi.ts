import type { ApiResponse, FetchPointsParams } from '../types/inpost';

const BASE_URL = 'https://api-global-points.easypack24.net/v1/points';

/**
 * Fetches a single page of InPost points with optional filtering.
 * Throws on non-OK HTTP responses.
 */
export async function fetchPoints(params: FetchPointsParams = {}): Promise<ApiResponse> {
  const { city, country = 'PL', page = 1, perPage = 100, relativePoint } = params;

  const query = new URLSearchParams({
    country,
    page: String(page),
    per_page: String(perPage),
  });

  if (city && city.trim().length > 0) {
    query.set('city', city.trim());
  }

  if (relativePoint) {
    query.set('relative_point', relativePoint);
  }

  const url = `${BASE_URL}?${query.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`InPost API error: ${response.status} ${response.statusText}`);
  }

  const data: ApiResponse = await response.json() as ApiResponse;
  return data;
}

/**
 * Fetches multiple pages of points for a given city and accumulates results.
 * Useful for loading all points for a small city (usually < 5 pages).
 */
export async function fetchAllPointsForCity(
  city: string,
  country = 'PL',
  maxPages = 10,
): Promise<ApiResponse> {
  const firstPage = await fetchPoints({ city, country, page: 1, perPage: 100 });

  const totalPages = Math.min(firstPage.total_pages, maxPages);

  if (totalPages <= 1) {
    return firstPage;
  }

  const remainingRequests = Array.from({ length: totalPages - 1 }, (_, i) =>
    fetchPoints({ city, country, page: i + 2, perPage: 100 }),
  );

  const remainingPages = await Promise.all(remainingRequests);
  const allItems = [
    ...firstPage.items,
    ...remainingPages.flatMap((p) => p.items),
  ];

  return {
    ...firstPage,
    items: allItems,
    count: allItems.length,
  };
}
