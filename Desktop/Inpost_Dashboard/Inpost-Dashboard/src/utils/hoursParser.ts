import type { Point } from '../types/inpost';

/**
 * Represents a parsed time window (e.g. 08:00–22:00).
 */
export interface TimeWindow {
  openHour: number;
  openMinute: number;
  closeHour: number;
  closeMinute: number;
}

export type ParsedHours = '24/7' | TimeWindow | 'unknown';

/**
 * Parses an InPost opening_hours string into a structured format.
 *
 * Handles:
 *   - "24/7"                         → '24/7'
 *   - "08:00-22:00"                   → TimeWindow
 *   - "Pn-Sb 09:00-21:00; Nd 10:00-18:00" → first window only (simplified)
 */
export function parseOpeningHours(raw: string): ParsedHours {
  const trimmed = raw.trim();

  if (trimmed === '24/7' || trimmed.toLowerCase() === '24h') {
    return '24/7';
  }

  // Match HH:MM-HH:MM or HH-HH pattern (possibly after day prefix)
  const timePattern = /(\d{1,2})(?::(\d{2}))?\s*[-–]\s*(\d{1,2})(?::(\d{2}))?/;
  const match = trimmed.match(timePattern);

  if (match) {
    return {
      openHour: parseInt(match[1], 10),
      openMinute: match[2] ? parseInt(match[2], 10) : 0,
      closeHour: parseInt(match[3], 10),
      closeMinute: match[4] ? parseInt(match[4], 10) : 0,
    };
  }

  return 'unknown';
}

/**
 * Determines whether a point is open at a given hour (0–23).
 *
 * Rules:
 *  - location_247: true  → always open
 *  - opening_hours "24/7" → always open
 *  - Parsed TimeWindow    → check if `hour` falls within range
 *  - 'unknown'            → assume open (graceful fallback)
 */
export function isOpenAt(point: Point, hour: number): boolean {
  // 24/7 outdoor points are always open
  if (point.location_247) {
    return true;
  }

  const parsed = parseOpeningHours(point.opening_hours);

  if (parsed === '24/7') {
    return true;
  }

  if (parsed === 'unknown') {
    // Unknown hours — show as open to avoid hiding points incorrectly
    return true;
  }

  const { openHour, closeHour, closeMinute } = parsed;

  // Handle overnight windows (e.g. 22:00–06:00) — rare for InPost but defensive
  if (closeHour < openHour) {
    return hour >= openHour || hour < closeHour || (hour === closeHour && closeMinute > 0);
  }

  if (hour < openHour) return false;
  if (hour > closeHour) return false;
  // Exactly at closing hour with minutes = treat as closed
  if (hour === closeHour && closeMinute === 0) return false;

  return true;
}

/**
 * Returns a human-readable label for a point's opening hours.
 */
export function formatOpeningHours(raw: string): string {
  if (!raw) return 'No data';
  if (raw.trim() === '24/7' || raw.trim().toLowerCase() === '24h') return 'Open 24/7';

  // For display purposes, it's safer to return the raw string so we don't lose
  // weekend hours if the string is like "PN-PT 11-20 SB-ND 12-19".
  return raw;
}
