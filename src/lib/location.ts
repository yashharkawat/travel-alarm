import { LatLng } from "./types";

export function getCurrentPosition(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  });
}

export function watchPosition(
  onUpdate: (coords: LatLng, speed: number | null, timestamp: number) => void,
  onError: (err: GeolocationPositionError) => void
): number {
  return navigator.geolocation.watchPosition(
    (pos) => {
      const coords: LatLng = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };
      const speed =
        pos.coords.speed !== null ? pos.coords.speed * 3.6 : null; // m/s → km/h
      onUpdate(coords, speed, pos.timestamp);
    },
    onError,
    { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
  );
}

export function clearWatch(watchId: number): void {
  navigator.geolocation.clearWatch(watchId);
}
