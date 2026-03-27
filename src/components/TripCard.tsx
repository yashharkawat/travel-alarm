"use client";

import Link from "next/link";
import { Trip } from "@/lib/types";

interface Props {
  trip: Trip;
  onDelete: (id: string) => void;
}

const modeIcons: Record<string, string> = {
  bus: "🚌",
  train: "🚂",
  car: "🚗",
};

export default function TripCard({ trip, onDelete }: Props) {
  const statusColors: Record<string, string> = {
    planned: "border-yellow-600",
    active: "border-blue-500",
    completed: "border-green-600",
  };

  const statusLabels: Record<string, string> = {
    planned: "Planned",
    active: "Active",
    completed: "Completed",
  };

  return (
    <div
      className={`bg-gray-900 border ${statusColors[trip.status]} rounded-xl p-4 transition-colors`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{modeIcons[trip.mode]}</span>
          <div>
            <h3 className="text-white font-medium">
              {trip.from ? `${trip.from.name} → ` : ""}
              {trip.to.name}
            </h3>
            {!trip.from && (
              <span className="text-xs text-gray-500">From current location</span>
            )}
          </div>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            trip.status === "active"
              ? "bg-blue-900 text-blue-300"
              : trip.status === "completed"
                ? "bg-green-900 text-green-300"
                : "bg-yellow-900 text-yellow-300"
          }`}
        >
          {statusLabels[trip.status]}
        </span>
      </div>

      <div className="text-sm text-gray-400 mb-3">
        {trip.alarms.length} alarm{trip.alarms.length !== 1 ? "s" : ""} set
      </div>

      <div className="flex gap-2">
        {trip.status === "planned" && (
          <Link
            href={`/trip/${trip.id}`}
            className="flex-1 py-2 text-center bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            Start Trip
          </Link>
        )}
        {trip.status === "active" && (
          <Link
            href={`/trip/${trip.id}`}
            className="flex-1 py-2 text-center bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            View Tracking
          </Link>
        )}
        {trip.status !== "active" && (
          <button
            onClick={() => onDelete(trip.id)}
            className="px-3 py-2 bg-gray-800 text-gray-400 rounded-lg text-sm hover:bg-red-900 hover:text-red-300 transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
