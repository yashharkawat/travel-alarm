"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";
import { sendNotification } from "@/lib/notifications";
import { trackEvent } from "analytics-kit";
import { Trip } from "@/lib/types";

export function useAlarmChecker(trip: Trip | null) {
  const tracking = useAppStore((s) => s.tracking);
  const markAlarmTriggered = useAppStore((s) => s.markAlarmTriggered);
  const checkedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!trip || trip.status !== "active") return;

    const interval = setInterval(() => {
      for (const alarm of trip.alarms) {
        if (alarm.triggered || checkedRef.current.has(alarm.id)) continue;

        let shouldTrigger = false;

        if (alarm.type === "distance") {
          shouldTrigger = tracking.distanceRemaining <= alarm.value;
        } else if (alarm.type === "time") {
          shouldTrigger =
            tracking.etaMinutes !== null && tracking.etaMinutes <= alarm.value;
        }

        if (shouldTrigger) {
          checkedRef.current.add(alarm.id);
          markAlarmTriggered(trip.id, alarm.id);

          const msg =
            alarm.type === "distance"
              ? `${alarm.value} km remaining to ${trip.to.name}!`
              : `${alarm.value} minutes remaining to ${trip.to.name}!`;

          sendNotification("Travel Alarm", msg);
          trackEvent("alarm_triggered", {
            type: alarm.type,
            value: alarm.value,
            destination: trip.to.name,
          });
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [trip, tracking, markAlarmTriggered]);
}
