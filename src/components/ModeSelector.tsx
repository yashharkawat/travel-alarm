"use client";

import { TravelMode } from "@/lib/types";

interface Props {
  value: TravelMode;
  onChange: (mode: TravelMode) => void;
}

const modes: { value: TravelMode; label: string; icon: string }[] = [
  { value: "bus", label: "Bus", icon: "🚌" },
  { value: "train", label: "Train", icon: "🚂" },
  { value: "car", label: "Car", icon: "🚗" },
];

export default function ModeSelector({ value, onChange }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">
        Travel Mode
      </label>
      <div className="flex gap-2">
        {modes.map((m) => (
          <button
            key={m.value}
            onClick={() => onChange(m.value)}
            className={`flex-1 py-2.5 rounded-lg text-center transition-colors ${
              value === m.value
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            <span className="text-lg">{m.icon}</span>
            <span className="ml-1 text-sm">{m.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
