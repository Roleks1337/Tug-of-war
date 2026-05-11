const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/reverse';

/**
 * Reverse-geocodes a lat/lng pair to a Polish city name using OpenStreetMap Nominatim.
 * Returns null if the location cannot be resolved to a city.
 *
 * Nominatim requires a User-Agent header and has a 1 req/s rate limit.
 * Callers are responsible for debouncing.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  const url = `${NOMINATIM_BASE}?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'InPostTimeTravelerDashboard/1.0 (educational project)',
      'Accept-Language': 'pl',
    },
  });

  if (!response.ok) return null;

  const data = await response.json() as {
    address?: {
      city?: string;
      town?: string;
      village?: string;
      municipality?: string;
      county?: string;
    };
  };

  const addr = data.address;
  if (!addr) return null;

  // Prefer city > town > village > municipality
  return addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? null;
}
