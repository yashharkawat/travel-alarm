"use client";

import { useEffect, useRef } from "react";
import { LatLng } from "@/lib/types";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Props {
  currentLocation: LatLng | null;
  destination: LatLng;
}

export default function LiveMap({ currentLocation, destination }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const currentMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView(
      [destination.lat, destination.lng],
      10
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // Destination marker (red)
    const destIcon = L.divIcon({
      html: '<div style="background:#ef4444;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 6px rgba(0,0,0,0.5)"></div>',
      iconSize: [14, 14],
      iconAnchor: [7, 7],
      className: "",
    });
    destMarkerRef.current = L.marker([destination.lat, destination.lng], {
      icon: destIcon,
    })
      .addTo(map)
      .bindPopup("Destination");

    // Current location marker (blue)
    const currIcon = L.divIcon({
      html: '<div style="background:#3b82f6;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 6px rgba(0,0,0,0.5)"></div>',
      iconSize: [14, 14],
      iconAnchor: [7, 7],
      className: "",
    });
    currentMarkerRef.current = L.marker(
      currentLocation
        ? [currentLocation.lat, currentLocation.lng]
        : [destination.lat, destination.lng],
      { icon: currIcon }
    )
      .addTo(map)
      .bindPopup("You");

    mapInstanceRef.current = map;

    // Fit bounds
    if (currentLocation) {
      const bounds = L.latLngBounds(
        [currentLocation.lat, currentLocation.lng],
        [destination.lat, destination.lng]
      );
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [destination]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update current location marker
  useEffect(() => {
    if (!currentLocation || !currentMarkerRef.current || !mapInstanceRef.current)
      return;
    currentMarkerRef.current.setLatLng([
      currentLocation.lat,
      currentLocation.lng,
    ]);
  }, [currentLocation]);

  return (
    <div
      ref={mapRef}
      className="w-full h-64 rounded-xl overflow-hidden border border-gray-700"
    />
  );
}
