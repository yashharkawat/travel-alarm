"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import TripCard from "@/components/TripCard";

export default function Home() {
  const { trips, hydrated, hydrate, deleteTrip } = useAppStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const activeTrips = trips.filter((t) => t.status === "active");
  const plannedTrips = trips.filter((t) => t.status === "planned");
  const completedTrips = trips.filter((t) => t.status === "completed");

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Travel Alarm</h1>
          <p className="text-sm text-gray-500">Never miss your stop</p>
        </div>
        <Link
          href="/trip/new"
          className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + New Trip
        </Link>
      </div>

      {trips.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🗺️</div>
          <h2 className="text-lg text-gray-300 mb-1">No trips yet</h2>
          <p className="text-sm text-gray-500 mb-4">
            Create your first trip and set alarms for your destination
          </p>
          <Link
            href="/trip/new"
            className="inline-block px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            Create Trip
          </Link>
        </div>
      )}

      {/* Active Trips */}
      {activeTrips.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
            Active
          </h2>
          <div className="space-y-3">
            {activeTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} onDelete={deleteTrip} />
            ))}
          </div>
        </div>
      )}

      {/* Planned Trips */}
      {plannedTrips.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
            Planned
          </h2>
          <div className="space-y-3">
            {plannedTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} onDelete={deleteTrip} />
            ))}
          </div>
        </div>
      )}

      {/* Completed Trips */}
      {completedTrips.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
            Completed
          </h2>
          <div className="space-y-3">
            {completedTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} onDelete={deleteTrip} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
