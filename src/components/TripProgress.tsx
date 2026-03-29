"use client";

interface Props {
  distanceRemaining: number;
  etaMinutes: number | null;
  currentSpeed: number;
  averageSpeed: number;
  initialDistance: number | null;
}

export default function TripProgress({
  distanceRemaining,
  etaMinutes,
  currentSpeed,
  averageSpeed,
  initialDistance,
}: Props) {
  const progress =
    initialDistance && initialDistance > 0
      ? Math.max(0, Math.min(100, ((initialDistance - distanceRemaining) / initialDistance) * 100))
      : 0;

  function formatEta(minutes: number | null): string {
    if (minutes === null) return "Calculating...";
    if (minutes < 1) return "Arriving!";
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="text-center">
          <div className="text-lg font-bold text-white">
            {distanceRemaining < 1
              ? `${Math.round(distanceRemaining * 1000)}m`
              : `${distanceRemaining.toFixed(1)}km`}
          </div>
          <div className="text-xs text-gray-400">To destination</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-white">
            {formatEta(etaMinutes)}
          </div>
          <div className="text-xs text-gray-400">ETA</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-white">
            {Math.round(currentSpeed)} km/h
          </div>
          <div className="text-xs text-gray-400">Speed</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-white">
            {Math.round(averageSpeed)} km/h
          </div>
          <div className="text-xs text-gray-400">Avg (15m)</div>
        </div>
      </div>
    </div>
  );
}
