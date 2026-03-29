"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAppStore } from "@/lib/store";
import { getCurrentPosition } from "@/lib/location";
import {
  requestNotificationPermission,
  stopAlarmSound,
  registerServiceWorker,
  unlockAudio,
  requestWakeLock,
  releaseWakeLock,
  showTrackingNotification,
  updateTrackingNotification,
  clearTrackingNotification,
} from "@/lib/notifications";
import { useLocationTracking } from "@/hooks/useLocationTracking";
import { useAlarmChecker } from "@/hooks/useAlarmChecker";
import TripProgress from "@/components/TripProgress";
import AlarmItem from "@/components/AlarmItem";
import AlarmForm from "@/components/AlarmForm";

const LiveMap = dynamic(() => import("@/components/LiveMap"), { ssr: false });

export default function TripTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { trips, hydrated, hydrate, startTrip, endTrip, addAlarm, removeAlarm } =
    useAppStore();
  const tracking = useAppStore((s) => s.tracking);

  const [error, setError] = useState<string | null>(null);
  const [showAlarmForm, setShowAlarmForm] = useState(false);
  const [starting, setStarting] = useState(false);

  const trip = trips.find((t) => t.id === id) ?? null;

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  // Register service worker on mount
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Start trip if planned
  useEffect(() => {
    if (!trip || trip.status !== "planned" || starting) return;
    setStarting(true);

    (async () => {
      try {
        await requestNotificationPermission();
        unlockAudio(); // Pre-unlock audio context
        const loc = await getCurrentPosition();
        startTrip(trip.id, loc);
        // Request wake lock to keep device awake
        await requestWakeLock();
        // Show persistent tracking notification
        showTrackingNotification(
          `Tracking trip to ${trip.to.name}`,
          trip.id
        );
      } catch {
        setError(
          "Could not get your location. Please enable location access and reload."
        );
      }
    })();
  }, [trip, starting, startTrip]);

  // Update persistent notification with live stats
  useEffect(() => {
    if (!trip || trip.status !== "active" || !tracking.currentLocation) return;
    const dist = tracking.distanceRemaining;
    const distStr =
      dist < 1
        ? `${Math.round(dist * 1000)}m`
        : `${dist.toFixed(1)}km`;
    const etaStr =
      tracking.etaMinutes !== null
        ? tracking.etaMinutes < 1
          ? "Arriving!"
          : `${Math.round(tracking.etaMinutes)}min`
        : "...";
    updateTrackingNotification(
      `${distStr} to ${trip.to.name} | ETA: ${etaStr} | Avg: ${Math.round(tracking.averageSpeed)} km/h`,
      trip.id
    );
  }, [trip, tracking]);

  // Track location
  const destinationCoords =
    trip?.status === "active" ? trip.to.coords : null;
  useLocationTracking(destinationCoords);

  // Check alarms
  useAlarmChecker(trip);

  function handleEndTrip() {
    if (!trip) return;
    stopAlarmSound();
    clearTrackingNotification();
    releaseWakeLock();
    endTrip(trip.id);
    router.push("/");
  }

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="text-center py-16">
        <div className="text-lg text-gray-300 mb-3">Trip not found</div>
        <button
          onClick={() => router.push("/")}
          className="text-blue-400 hover:text-blue-300"
        >
          Go Home
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="text-red-400 mb-3">{error}</div>
        <button
          onClick={() => router.push("/")}
          className="text-blue-400 hover:text-blue-300"
        >
          Go Home
        </button>
      </div>
    );
  }

  if (trip.status === "planned") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Starting trip...</div>
      </div>
    );
  }

  const modeIcons: Record<string, string> = {
    bus: "🚌",
    train: "🚂",
    car: "🚗",
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            {modeIcons[trip.mode]} Heading to {trip.to.name}
          </h1>
          {trip.from && (
            <p className="text-sm text-gray-500">From {trip.from.name}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-green-400">Live</span>
        </div>
      </div>

      {/* Map */}
      <div className="mb-4">
        <LiveMap
          currentLocation={tracking.currentLocation}
          destination={trip.to.coords}
        />
      </div>

      {/* Progress */}
      <div className="mb-4">
        <TripProgress
          distanceRemaining={tracking.distanceRemaining}
          etaMinutes={tracking.etaMinutes}
          currentSpeed={tracking.currentSpeed}
          averageSpeed={tracking.averageSpeed}
          initialDistance={trip.initialDistance}
        />
      </div>

      {/* Alarms */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
            Alarms
          </h2>
          <button
            onClick={() => setShowAlarmForm(true)}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            + Add
          </button>
        </div>

        {trip.alarms.length === 0 && (
          <div className="text-sm text-gray-600 bg-gray-900 rounded-lg p-3 text-center border border-gray-800">
            No alarms set
          </div>
        )}

        <div className="space-y-2">
          {trip.alarms.map((alarm) => (
            <AlarmItem
              key={alarm.id}
              alarm={alarm}
              onRemove={() => removeAlarm(trip.id, alarm.id)}
            />
          ))}
        </div>
      </div>

      {/* Stop alarm sound button - show when any alarm triggered */}
      {trip.alarms.some((a) => a.triggered) && (
        <button
          onClick={() => {
            stopAlarmSound();
            unlockAudio(); // Re-unlock for next alarm
          }}
          className="w-full py-2.5 mb-3 bg-yellow-600 text-white rounded-xl text-sm hover:bg-yellow-700 transition-colors"
        >
          Stop Alarm Sound
        </button>
      )}

      {/* End Trip */}
      <button
        onClick={handleEndTrip}
        className="w-full py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
      >
        End Trip
      </button>

      {showAlarmForm && (
        <AlarmForm
          onAdd={(type, value) => {
            addAlarm(trip.id, type, value);
            setShowAlarmForm(false);
          }}
          onClose={() => setShowAlarmForm(false)}
        />
      )}
    </div>
  );
}
