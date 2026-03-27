# Travel Alarm — Low Level Design

## 1. Project Structure

```
travel-alarm/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout, global styles, notification init
│   │   ├── page.tsx                # Home — trip list
│   │   ├── trip/
│   │   │   ├── new/
│   │   │   │   └── page.tsx        # Create trip form
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Live tracking view
│   ├── components/
│   │   ├── TripCard.tsx            # Trip summary card for home list
│   │   ├── AlarmItem.tsx           # Single alarm row (edit/delete)
│   │   ├── AlarmForm.tsx           # Add/edit alarm modal
│   │   ├── PlaceSearch.tsx         # Nominatim autocomplete input
│   │   ├── LiveMap.tsx             # Leaflet map with markers
│   │   ├── TripProgress.tsx        # Distance, ETA, speed stats
│   │   └── ModeSelector.tsx        # Bus/Train/Car toggle
│   ├── lib/
│   │   ├── store.ts                # Zustand store (trips, active tracking)
│   │   ├── geo.ts                  # Haversine, bearing, ETA calculations
│   │   ├── location.ts             # Geolocation API wrapper
│   │   ├── notifications.ts        # Browser Notifications API wrapper
│   │   ├── storage.ts              # localStorage read/write with JSON parse
│   │   └── types.ts                # TypeScript interfaces
│   └── hooks/
│       ├── useLocationTracking.ts  # Watchposition + cleanup
│       └── useAlarmChecker.ts      # Interval that checks alarm conditions
├── public/
│   ├── alarm.mp3                   # Alarm sound file
│   └── favicon.ico
├── package.json
├── tsconfig.json
├── next.config.js
└── LLD.md
```

## 2. Data Models

```typescript
// lib/types.ts

interface LatLng {
  lat: number;
  lng: number;
}

interface Place {
  name: string;        // "Goa, India"
  coords: LatLng;
}

type TravelMode = 'bus' | 'train' | 'car';
type TripStatus = 'planned' | 'active' | 'completed';
type AlarmType = 'distance' | 'time';

interface Alarm {
  id: string;
  type: AlarmType;
  value: number;        // km for distance, minutes for time
  triggered: boolean;
}

interface Trip {
  id: string;
  from: Place | null;   // null = use current location at start
  to: Place;
  mode: TravelMode;
  status: TripStatus;
  alarms: Alarm[];
  startedAt: string | null;    // ISO timestamp
  completedAt: string | null;
  // Resolved at trip start (snapshot of current location if from=null)
  resolvedFromCoords: LatLng | null;
}
```

## 3. State Management (Zustand)

```typescript
// lib/store.ts

interface TrackingState {
  currentLocation: LatLng | null;
  currentSpeed: number;          // km/h (rolling avg last 5 readings)
  distanceRemaining: number;     // km to destination
  etaMinutes: number;            // estimated minutes to arrival
  speedHistory: number[];        // last 10 speed readings for rolling avg
}

interface AppState {
  trips: Trip[];
  tracking: TrackingState;

  // Trip CRUD
  addTrip: (trip: Omit<Trip, 'id' | 'status' | 'startedAt' | 'completedAt' | 'resolvedFromCoords'>) => string;
  deleteTrip: (id: string) => void;
  startTrip: (id: string, currentLocation: LatLng) => void;
  endTrip: (id: string) => void;

  // Alarm CRUD
  addAlarm: (tripId: string, alarm: Omit<Alarm, 'id' | 'triggered'>) => void;
  removeAlarm: (tripId: string, alarmId: string) => void;
  markAlarmTriggered: (tripId: string, alarmId: string) => void;

  // Tracking
  updateLocation: (location: LatLng, speed: number) => void;
  updateDistanceAndEta: (distance: number, eta: number) => void;
}
```

**Persistence:** Store subscribes to changes → serializes `trips[]` to `localStorage` key `travel-alarm-trips`. Tracking state is ephemeral (not persisted).

## 4. Core Algorithms

### 4a. Haversine Distance (`lib/geo.ts`)

```
function haversineDistance(a: LatLng, b: LatLng): number
  → returns distance in km between two coordinates
  → standard haversine formula, Earth radius = 6371 km
```

### 4b. ETA Calculation

```
function calculateETA(distanceKm: number, speedHistory: number[]): number
  → rollingAvgSpeed = average of last 10 speed readings
  → if rollingAvgSpeed < 1 km/h → return Infinity (stationary)
  → return (distanceKm / rollingAvgSpeed) * 60  // minutes
```

### 4c. Alarm Check Logic (`hooks/useAlarmChecker.ts`)

Runs every **5 seconds** when a trip is active:

```
for each alarm in activeTrip.alarms where !alarm.triggered:
  if alarm.type === 'distance':
    if distanceRemaining <= alarm.value:
      → trigger alarm
  if alarm.type === 'time':
    if etaMinutes <= alarm.value:
      → trigger alarm
```

**Trigger alarm** means:
1. Play `alarm.mp3` (Audio API)
2. Fire browser notification with title "Travel Alarm" + message
3. Mark alarm as `triggered: true` in store

## 5. Location Tracking (`hooks/useLocationTracking.ts`)

```
When trip starts:
  1. Request permission: navigator.geolocation.getCurrentPosition()
  2. Start watching: navigator.geolocation.watchPosition(callback, error, {
       enableHighAccuracy: true,
       maximumAge: 10000,        // accept 10s old cached position
       timeout: 15000
     })
  3. On each position update:
     a. Extract lat, lng, speed from GeolocationPosition
     b. If speed is null → calculate from last position + time delta
     c. Call store.updateLocation({ lat, lng }, speedKmh)
     d. Calculate new distance: haversineDistance(current, destination)
     e. Calculate new ETA: calculateETA(distance, speedHistory)
     f. Call store.updateDistanceAndEta(distance, eta)

When trip ends:
  → navigator.geolocation.clearWatch(watchId)
```

**Adaptive frequency:** Browser's watchPosition fires on every change. We debounce updates to once per 5 seconds to avoid excessive re-renders.

## 6. Component Details

### PlaceSearch
- Input with debounced (300ms) Nominatim API calls
- Endpoint: `https://nominatim.openstreetmap.org/search?q={query}&format=json&limit=5`
- Displays dropdown with results, user selects one → returns `Place { name, coords }`
- Rate limit: max 1 req/sec (Nominatim policy)

### LiveMap (Leaflet)
- Tile layer: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- Two markers: current location (blue) + destination (red)
- Auto-centers to fit both markers
- Updates current location marker on each tracking update

### AlarmForm
- Toggle: distance (km) / time (minutes)
- Number input for value
- Preset quick-select buttons: 5km, 10km, 25km / 5min, 15min, 30min

### TripProgress
- Shows: distance remaining, ETA, current speed
- Progress bar: based on (initial distance - current distance) / initial distance
- Updates every 5 seconds with tracking data

## 7. Notification Flow

```
App Start:
  → Check Notification.permission
  → If "default" → request permission on first trip start

Alarm Triggered:
  → new Notification("Travel Alarm", {
       body: "5 km remaining to Goa!",
       icon: "/favicon.ico",
       requireInteraction: true    // stays until dismissed
     })
  → const audio = new Audio("/alarm.mp3")
  → audio.play()
```

## 8. Page Flows

### Home (`/`)
```
On mount → load trips from store (hydrated from localStorage)
Display:
  - Active trips (status === 'active') at top
  - Planned trips (status === 'planned')
  - Completed trips (status === 'completed') — collapsible
  - FAB or button → navigate to /trip/new
```

### Create Trip (`/trip/new`)
```
Form state: { from: Place | null, to: Place, mode: TravelMode, alarms: Alarm[] }
  - "From" field: prefilled with "Current Location", tap to search a place
  - "To" field: required, PlaceSearch component
  - Mode selector
  - Alarm list + add button
  - "Start Trip" → addTrip to store → navigate to /trip/[id]
```

### Live Tracking (`/trip/[id]`)
```
On mount:
  → Get trip from store by id
  → If trip.status === 'planned' → startTrip(id, currentLocation)
  → Begin location tracking (useLocationTracking)
  → Begin alarm checking (useAlarmChecker)

Display:
  → LiveMap, TripProgress, alarm list with status
  → "End Trip" button → endTrip(id) → navigate home
```

## 9. Edge Cases

| Case | Handling |
|------|----------|
| Location permission denied | Show error banner with instructions to enable |
| User closes tab mid-trip | Trip stays "active" in localStorage, resume on return |
| Speed = 0 for extended time | ETA shows "Calculating..." instead of infinity |
| Nominatim rate limit hit | Debounce + show "Try again" message |
| Multiple alarms trigger at once | Queue notifications, play sound once |
| Browser doesn't support notifications | Fall back to in-app alert modal + sound |
| Very short trip (< 1km) | Still works, distance updates more frequently meaningful |

## 10. External Dependencies

```json
{
  "dependencies": {
    "next": "^15",
    "react": "^19",
    "react-dom": "^19",
    "zustand": "^5",
    "leaflet": "^1.9",
    "react-leaflet": "^5",
    "nanoid": "^5"
  },
  "devDependencies": {
    "@types/leaflet": "^1.9",
    "typescript": "^5",
    "tailwindcss": "^4"
  }
}
```

All free, open-source, zero API costs.
