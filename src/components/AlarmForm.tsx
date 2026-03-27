"use client";

import { useState } from "react";
import { AlarmType } from "@/lib/types";

interface Props {
  onAdd: (type: AlarmType, value: number) => void;
  onClose: () => void;
}

const distancePresets = [5, 10, 25, 50];
const timePresets = [5, 15, 30, 60];

export default function AlarmForm({ onAdd, onClose }: Props) {
  const [type, setType] = useState<AlarmType>("distance");
  const [value, setValue] = useState<string>("");

  function handleSubmit() {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) return;
    onAdd(type, num);
    onClose();
  }

  const presets = type === "distance" ? distancePresets : timePresets;
  const unit = type === "distance" ? "km" : "min";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl p-5 w-full max-w-sm border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Add Alarm</h3>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setType("distance")}
            className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
              type === "distance"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400"
            }`}
          >
            📏 Distance
          </button>
          <button
            onClick={() => setType("time")}
            className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
              type === "time"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400"
            }`}
          >
            ⏱ Time
          </button>
        </div>

        <div className="mb-3">
          <label className="block text-sm text-gray-400 mb-1">
            {type === "distance"
              ? "Trigger when remaining distance (km)"
              : "Trigger when remaining time (minutes)"}
          </label>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`Enter ${unit}...`}
            min="0"
            step="any"
            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-2 mb-4">
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => setValue(String(p))}
              className="flex-1 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-sm text-gray-300 transition-colors"
            >
              {p} {unit}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Alarm
          </button>
        </div>
      </div>
    </div>
  );
}
