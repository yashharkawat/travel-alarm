"use client";

import { useState, useRef, useEffect } from "react";
import { Place } from "@/lib/types";

interface Props {
  label: string;
  placeholder?: string;
  value: Place | null;
  onChange: (place: Place | null) => void;
  allowCurrentLocation?: boolean;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

export default function PlaceSearch({
  label,
  placeholder = "Search a place...",
  value,
  onChange,
  allowCurrentLocation = false,
}: Props) {
  const [query, setQuery] = useState(value?.name ?? "");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function search(q: string) {
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1&dedupe=1`
        );
        if (!res.ok) {
          throw new Error(`Search failed (${res.status})`);
        }
        const data: NominatimResult[] = await res.json();
        setResults(data);
        setOpen(true);
        if (data.length === 0) {
          setError("No results found. Try a different search.");
        }
      } catch (err) {
        setResults([]);
        setError(
          err instanceof Error
            ? `Search error: ${err.message}`
            : "Could not reach search service. Check your internet."
        );
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 400);
  }

  function selectResult(r: NominatimResult) {
    const parts = r.display_name.split(",").map((s) => s.trim());
    const displayName =
      parts.length > 2
        ? `${parts[0]}, ${parts[parts.length - 1]}`
        : parts.slice(0, 2).join(", ");
    const place: Place = {
      name: displayName,
      coords: { lat: parseFloat(r.lat), lng: parseFloat(r.lon) },
    };
    setQuery(place.name);
    onChange(place);
    setOpen(false);
    setResults([]);
    setError(null);
  }

  function useCurrentLocation() {
    onChange(null);
    setQuery("Current Location");
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-gray-300 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value !== value?.name) onChange(null);
            search(e.target.value);
          }}
          onFocus={() => {
            if (results.length > 0 || error) setOpen(true);
          }}
          className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gray-500 border-t-blue-400 rounded-full animate-spin" />
          </div>
        )}
      </div>
      {open && (results.length > 0 || allowCurrentLocation || error) && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden max-h-64 overflow-y-auto">
          {allowCurrentLocation && (
            <button
              onClick={useCurrentLocation}
              className="w-full px-3 py-2.5 text-left text-blue-400 hover:bg-gray-700 flex items-center gap-2 border-b border-gray-700"
            >
              <span>📍</span> Use Current Location
            </button>
          )}
          {error && results.length === 0 && (
            <div className="px-3 py-2.5 text-sm text-yellow-400">{error}</div>
          )}
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => selectResult(r)}
              className="w-full px-3 py-2.5 text-left text-gray-200 hover:bg-gray-700 text-sm border-b border-gray-700/50 last:border-0"
            >
              <div className="truncate">{r.display_name}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
