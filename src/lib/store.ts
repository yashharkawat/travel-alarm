import { create } from "zustand";
import { nanoid } from "nanoid";
import { Trip, Alarm, LatLng, AlarmType, TravelMode, Place } from "./types";
import { loadFromStorage, saveToStorage } from "./storage";
import { haversineDistance, calculateETA } from "./geo";
import { trackEvent } from "analytics-kit";

interface TrackingState {
  currentLocation: LatLng | null;
  currentSpeed: number;
  distanceRemaining: number;
  etaMinutes: number | null;
  speedHistory: number[];
}

interface AppState {
  trips: Trip[];
  tracking: TrackingState;
  hydrated: boolean;

  hydrate: () => void;
  addTrip: (input: {
    from: Place | null;
    to: Place;
    mode: TravelMode;
    alarms: { type: AlarmType; value: number }[];
  }) => string;
  deleteTrip: (id: string) => void;
  startTrip: (id: string, currentLocation: LatLng) => void;
  endTrip: (id: string) => void;

  addAlarm: (tripId: string, type: AlarmType, value: number) => void;
  removeAlarm: (tripId: string, alarmId: string) => void;
  markAlarmTriggered: (tripId: string, alarmId: string) => void;

  updateTracking: (location: LatLng, speed: number, destinationCoords: LatLng) => void;
  resetTracking: () => void;
}

const initialTracking: TrackingState = {
  currentLocation: null,
  currentSpeed: 0,
  distanceRemaining: 0,
  etaMinutes: null,
  speedHistory: [],
};

function persistTrips(trips: Trip[]) {
  saveToStorage(trips);
}

export const useAppStore = create<AppState>((set, get) => ({
  trips: [],
  tracking: { ...initialTracking },
  hydrated: false,

  hydrate: () => {
    const trips = loadFromStorage<Trip[]>([]);
    set({ trips, hydrated: true });
  },

  addTrip: (input) => {
    const id = nanoid();
    const trip: Trip = {
      id,
      from: input.from,
      to: input.to,
      mode: input.mode,
      status: "planned",
      alarms: input.alarms.map((a) => ({
        id: nanoid(),
        type: a.type,
        value: a.value,
        triggered: false,
      })),
      startedAt: null,
      completedAt: null,
      resolvedFromCoords: null,
      initialDistance: null,
    };
    const trips = [...get().trips, trip];
    set({ trips });
    persistTrips(trips);
    trackEvent("trip_created", {
      destination: input.to.name,
      mode: input.mode,
      alarm_count: input.alarms.length,
    });
    return id;
  },

  deleteTrip: (id) => {
    const trips = get().trips.filter((t) => t.id !== id);
    set({ trips });
    persistTrips(trips);
  },

  startTrip: (id, currentLocation) => {
    const trips = get().trips.map((t) => {
      if (t.id !== id) return t;
      const fromCoords = t.from?.coords ?? currentLocation;
      const initialDist = haversineDistance(fromCoords, t.to.coords);
      return {
        ...t,
        status: "active" as const,
        startedAt: new Date().toISOString(),
        resolvedFromCoords: fromCoords,
        initialDistance: initialDist,
      };
    });
    set({ trips });
    persistTrips(trips);
    const trip = trips.find((t) => t.id === id);
    if (trip) {
      trackEvent("trip_started", {
        destination: trip.to.name,
        mode: trip.mode,
        initial_distance_km: trip.initialDistance,
      });
    }
  },

  endTrip: (id) => {
    const trip = get().trips.find((t) => t.id === id);
    const trips = get().trips.map((t) =>
      t.id === id
        ? { ...t, status: "completed" as const, completedAt: new Date().toISOString() }
        : t
    );
    set({ trips, tracking: { ...initialTracking } });
    persistTrips(trips);
    if (trip) {
      trackEvent("trip_ended", {
        destination: trip.to.name,
        mode: trip.mode,
        alarms_triggered: trip.alarms.filter((a) => a.triggered).length,
      });
    }
  },

  addAlarm: (tripId, type, value) => {
    const trips = get().trips.map((t) =>
      t.id === tripId
        ? {
            ...t,
            alarms: [
              ...t.alarms,
              { id: nanoid(), type, value, triggered: false } as Alarm,
            ],
          }
        : t
    );
    set({ trips });
    persistTrips(trips);
  },

  removeAlarm: (tripId, alarmId) => {
    const trips = get().trips.map((t) =>
      t.id === tripId
        ? { ...t, alarms: t.alarms.filter((a) => a.id !== alarmId) }
        : t
    );
    set({ trips });
    persistTrips(trips);
  },

  markAlarmTriggered: (tripId, alarmId) => {
    const trips = get().trips.map((t) =>
      t.id === tripId
        ? {
            ...t,
            alarms: t.alarms.map((a) =>
              a.id === alarmId ? { ...a, triggered: true } : a
            ),
          }
        : t
    );
    set({ trips });
    persistTrips(trips);
  },

  updateTracking: (location, speed, destinationCoords) => {
    const prev = get().tracking;
    const newHistory = [...prev.speedHistory, speed].slice(-10);
    const distance = haversineDistance(location, destinationCoords);
    const eta = calculateETA(distance, newHistory);
    set({
      tracking: {
        currentLocation: location,
        currentSpeed: speed,
        distanceRemaining: distance,
        etaMinutes: eta,
        speedHistory: newHistory,
      },
    });
  },

  resetTracking: () => {
    set({ tracking: { ...initialTracking } });
  },
}));
