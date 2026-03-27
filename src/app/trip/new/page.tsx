"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Place, TravelMode, AlarmType } from "@/lib/types";
import PlaceSearch from "@/components/PlaceSearch";
import ModeSelector from "@/components/ModeSelector";
import AlarmForm from "@/components/AlarmForm";
import AlarmItem from "@/components/AlarmItem";

export default function NewTrip() {
  const router = useRouter();
  const addTrip = useAppStore((s) => s.addTrip);

  const [from, setFrom] = useState<Place | null>(null);
  const [fromIsCurrentLocation, setFromIsCurrentLocation] = useState(true);
  const [to, setTo] = useState<Place | null>(null);
  const [mode, setMode] = useState<TravelMode>("bus");
  const [alarms, setAlarms] = useState<{ type: AlarmType; value: number }[]>([]);
  const [showAlarmForm, setShowAlarmForm] = useState(false);

  function handleFromChange(place: Place | null) {
    if (place === null) {
      setFromIsCurrentLocation(true);
      setFrom(null);
    } else {
      setFromIsCurrentLocation(false);
      setFrom(place);
    }
  }

  function handleAddAlarm(type: AlarmType, value: number) {
    setAlarms([...alarms, { type, value }]);
  }

  function handleRemoveAlarm(index: number) {
    setAlarms(alarms.filter((_, i) => i !== index));
  }

  function handleCreate() {
    if (!to) return;

    const id = addTrip({
      from: fromIsCurrentLocation ? null : from,
      to,
      mode,
      alarms,
    });

    router.push(`/trip/${id}`);
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ← Back
        </button>
        <h1 className="text-xl font-bold text-white">New Trip</h1>
      </div>

      <div className="space-y-4">
        {/* From */}
        <PlaceSearch
          label="From (optional)"
          placeholder="Search or use current location..."
          value={from}
          onChange={handleFromChange}
          allowCurrentLocation
        />

        {fromIsCurrentLocation && (
          <div className="text-xs text-blue-400 -mt-2 ml-1">
            📍 Will use your current location when trip starts
          </div>
        )}

        {/* To */}
        <PlaceSearch
          label="Destination"
          placeholder="Where are you going?"
          value={to}
          onChange={setTo}
        />

        {/* Mode */}
        <ModeSelector value={mode} onChange={setMode} />

        {/* Alarms */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-300">Alarms</label>
            <button
              onClick={() => setShowAlarmForm(true)}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              + Add Alarm
            </button>
          </div>

          {alarms.length === 0 && (
            <div className="text-sm text-gray-600 bg-gray-900 rounded-lg p-4 text-center border border-gray-800">
              No alarms yet. Add one to get notified!
            </div>
          )}

          <div className="space-y-2">
            {alarms.map((alarm, i) => (
              <AlarmItem
                key={i}
                alarm={{ id: String(i), ...alarm, triggered: false }}
                onRemove={() => handleRemoveAlarm(i)}
              />
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleCreate}
          disabled={!to}
          className={`w-full py-3 rounded-xl text-white font-medium text-base transition-colors ${
            to
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-800 text-gray-500 cursor-not-allowed"
          }`}
        >
          Start Trip
        </button>
      </div>

      {showAlarmForm && (
        <AlarmForm
          onAdd={handleAddAlarm}
          onClose={() => setShowAlarmForm(false)}
        />
      )}
    </div>
  );
}
