"use client";

import { Alarm } from "@/lib/types";

interface Props {
  alarm: Alarm;
  onRemove: () => void;
}

export default function AlarmItem({ alarm, onRemove }: Props) {
  const icon = alarm.type === "distance" ? "📏" : "⏱";
  const unit = alarm.type === "distance" ? "km" : "min";
  const label =
    alarm.type === "distance"
      ? `${alarm.value} km remaining`
      : `${alarm.value} min before arrival`;

  return (
    <div
      className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${
        alarm.triggered
          ? "bg-green-900/30 border border-green-700"
          : "bg-gray-800 border border-gray-700"
      }`}
    >
      <div className="flex items-center gap-2">
        <span>{icon}</span>
        <span className={`text-sm ${alarm.triggered ? "text-green-400" : "text-gray-200"}`}>
          {label}
        </span>
        {alarm.triggered && (
          <span className="text-xs text-green-500 ml-1">✓ Triggered</span>
        )}
      </div>
      {!alarm.triggered && (
        <button
          onClick={onRemove}
          className="text-gray-500 hover:text-red-400 text-sm transition-colors"
        >
          ✕
        </button>
      )}
    </div>
  );
}
