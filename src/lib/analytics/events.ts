import posthog from "posthog-js";

export function trackEvent(eventName: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  posthog.capture(eventName, properties);
}

export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  posthog.identify(userId, properties);
}

export function resetUser() {
  if (typeof window === "undefined") return;
  posthog.reset();
}
