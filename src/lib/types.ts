export interface LatLng {
  lat: number;
  lng: number;
}

export interface Place {
  name: string;
  coords: LatLng;
}

export type TravelMode = "bus" | "train" | "car";
export type TripStatus = "planned" | "active" | "completed";
export type AlarmType = "distance" | "time";

export interface Alarm {
  id: string;
  type: AlarmType;
  value: number; // km for distance, minutes for time
  triggered: boolean;
}

export interface Trip {
  id: string;
  from: Place | null; // null = current location at trip start
  to: Place;
  mode: TravelMode;
  status: TripStatus;
  alarms: Alarm[];
  startedAt: string | null;
  completedAt: string | null;
  resolvedFromCoords: LatLng | null;
  initialDistance: number | null; // km, set when trip starts (for progress bar)
}
