import { describe, it, expect } from 'vitest';
import { parseOpeningHours, isOpenAt, formatOpeningHours } from './hoursParser';
import type { Point } from '../types/inpost';

// ---- Minimal Point factory for testing ----
function makePoint(overrides: Partial<Pick<Point, 'opening_hours' | 'location_247'>>): Point {
  return {
    href: '',
    country: 'PL',
    name: 'TEST01M',
    type: ['parcel_locker'],
    status: 'Operating',
    location: { longitude: 0, latitude: 0 },
    location_type: 'Outdoor',
    location_category: 'Generic',
    location_date: null,
    location_description: null,
    location_description_1: null,
    location_description_2: null,
    distance: null,
    opening_hours: '24/7',
    address: { line1: '', line2: '' },
    address_details: { city: '', province: '', post_code: '', street: '', building_number: '', flat_number: null },
    phone_number: null,
    payment_point_descr: null,
    functions: [],
    partner_id: 0,
    is_next: false,
    payment_available: true,
    virtual: '0',
    recommended_low_interest_box_machines_list: null,
    apm_doubled: null,
    location_247: true,
    operating_hours_extended: { customer: null },
    agency: '',
    agencies_extended: [],
    image_url: '',
    easy_access_zone: false,
    air_index_level: null,
    physical_type: '',
    physical_type_mapped: '',
    physical_type_description: null,
    in_mobile_collect_excluded: null,
    in_mobile_send_excluded: null,
    in_mobile_return_excluded: null,
    express_delivery_send: false,
    express_delivery_collect: false,
    delivery_area_id: null,
    micro_area_id: null,
    agency_code: null,
    locker_availability: { status: 'NO_DATA', details: { A: 'NO_DATA', B: 'NO_DATA', C: 'NO_DATA' } },
    supported_locker_temperatures: null,
    unavailability_periods: null,
    mondial_relay_id: '00000',
    print_in_store: null,
    ...overrides,
  };
}

// ==================================================================
// parseOpeningHours
// ==================================================================
describe('parseOpeningHours', () => {
  it('returns "24/7" for literal "24/7" string', () => {
    expect(parseOpeningHours('24/7')).toBe('24/7');
  });

  it('returns "24/7" for "24h" string', () => {
    expect(parseOpeningHours('24h')).toBe('24/7');
  });

  it('parses a simple HH:MM-HH:MM range', () => {
    const result = parseOpeningHours('08:00-22:00');
    expect(result).toEqual({ openHour: 8, openMinute: 0, closeHour: 22, closeMinute: 0 });
  });

  it('parses a range with day prefix (e.g. "Pn-Sb 09:00-21:00")', () => {
    const result = parseOpeningHours('Pn-Sb 09:00-21:00');
    expect(result).toEqual({ openHour: 9, openMinute: 0, closeHour: 21, closeMinute: 0 });
  });

  it('returns "unknown" for empty or unrecognised strings', () => {
    expect(parseOpeningHours('')).toBe('unknown');
    expect(parseOpeningHours('closed')).toBe('unknown');
  });
});

// ==================================================================
// isOpenAt
// ==================================================================
describe('isOpenAt', () => {
  it('returns true for a location_247 point at any hour', () => {
    const point = makePoint({ location_247: true, opening_hours: '08:00-20:00' });
    expect(isOpenAt(point, 3)).toBe(true);
    expect(isOpenAt(point, 23)).toBe(true);
  });

  it('returns true for a 24/7 opening_hours point at any hour', () => {
    const point = makePoint({ location_247: false, opening_hours: '24/7' });
    expect(isOpenAt(point, 0)).toBe(true);
    expect(isOpenAt(point, 23)).toBe(true);
  });

  it('returns true during open hours (08:00-22:00 at 12:00)', () => {
    const point = makePoint({ location_247: false, opening_hours: '08:00-22:00' });
    expect(isOpenAt(point, 12)).toBe(true);
  });

  it('returns false before opening time (08:00-22:00 at 07:00)', () => {
    const point = makePoint({ location_247: false, opening_hours: '08:00-22:00' });
    expect(isOpenAt(point, 7)).toBe(false);
  });

  it('returns false after closing time (08:00-22:00 at 23:00)', () => {
    const point = makePoint({ location_247: false, opening_hours: '08:00-22:00' });
    expect(isOpenAt(point, 23)).toBe(false);
  });

  it('returns false exactly at closing hour (08:00-22:00 at 22:00 with 0 minutes)', () => {
    const point = makePoint({ location_247: false, opening_hours: '08:00-22:00' });
    expect(isOpenAt(point, 22)).toBe(false);
  });

  it('returns true at opening time exactly (08:00-22:00 at 08:00)', () => {
    const point = makePoint({ location_247: false, opening_hours: '08:00-22:00' });
    expect(isOpenAt(point, 8)).toBe(true);
  });

  it('returns true for unknown hours (graceful fallback)', () => {
    const point = makePoint({ location_247: false, opening_hours: 'closed' });
    expect(isOpenAt(point, 15)).toBe(true);
  });
});

// ==================================================================
// formatOpeningHours
// ==================================================================
describe('formatOpeningHours', () => {
  it('returns "Open 24/7" for 24/7', () => {
    expect(formatOpeningHours('24/7')).toBe('Open 24/7');
  });

  it('formats a parsed range correctly', () => {
    // We now return the raw string to avoid losing weekend data.
    expect(formatOpeningHours('08:00-22:00')).toBe('08:00-22:00');
  });

  it('returns original string for unrecognised input', () => {
    expect(formatOpeningHours('Weekdays only')).toBe('Weekdays only');
  });

  it('returns "No data" for empty string', () => {
    expect(formatOpeningHours('')).toBe('No data');
  });
});
