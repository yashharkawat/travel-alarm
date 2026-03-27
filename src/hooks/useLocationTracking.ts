"use client";

import { useEffect, useRef, useCallback } from "react";
import { watchPosition, clearWatch } from "@/lib/location";
import { calculateSpeed } from "@/lib/geo";
import { useAppStore } from "@/lib/store";
import { LatLng } from "@/lib/types";

export function useLocationTracking(destinationCoords: LatLng | null) {
  const watchIdRef = useRef<number | null>(null);
  const lastPosRef = useRef<{ coords: LatLng; timestamp: number } | null>(null);
  const updateTracking = useAppStore((s) => s.updateTracking);

  const stop = useCallback(() => {
    if (watchIdRef.current !== null) {
      clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    lastPosRef.current = null;
  }, []);

  useEffect(() => {
    if (!destinationCoords) return;

    watchIdRef.current = watchPosition(
      (coords, gpsSpeed, timestamp) => {
        let speed = gpsSpeed ?? 0;

        // If GPS doesn't provide speed, calculate from last position
        if (gpsSpeed === null && lastPosRef.current) {
          const dt = timestamp - lastPosRef.current.timestamp;
          if (dt > 0) {
            speed = calculateSpeed(lastPosRef.current.coords, coords, dt);
          }
        }

        lastPosRef.current = { coords, timestamp };
        updateTracking(coords, speed, destinationCoords);
      },
      (err) => {
        console.error("Location error:", err.message);
      }
    );

    return stop;
  }, [destinationCoords, updateTracking, stop]);

  return { stop };
}
