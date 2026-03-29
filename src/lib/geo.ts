import { LatLng, SpeedReading } from "./types";

const EARTH_RADIUS_KM = 6371;
const SPEED_WINDOW_MS = 15 * 60 * 1000; // 15 minutes window for average speed

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineDistance(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function getAverageSpeed(speedHistory: SpeedReading[]): number {
  if (speedHistory.length === 0) return 0;
  const now = Date.now();
  const recent = speedHistory.filter((r) => now - r.timestamp <= SPEED_WINDOW_MS);
  if (recent.length === 0) return 0;
  return recent.reduce((sum, r) => sum + r.speed, 0) / recent.length;
}

export function calculateETA(distanceKm: number, speedHistory: SpeedReading[]): number | null {
  const avg = getAverageSpeed(speedHistory);
  if (avg < 1) return null; // stationary
  return (distanceKm / avg) * 60; // minutes
}

export function calculateSpeed(
  prev: LatLng,
  curr: LatLng,
  timeDeltaMs: number
): number {
  if (timeDeltaMs <= 0) return 0;
  const distKm = haversineDistance(prev, curr);
  const hours = timeDeltaMs / (1000 * 60 * 60);
  return distKm / hours;
}
